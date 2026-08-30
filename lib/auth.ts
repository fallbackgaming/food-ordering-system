import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { AdminRole } from "@/lib/generated/prisma/client";

export const ADMIN_SESSION_COOKIE = "cafe_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 18; // 18 hours
const BCRYPT_ROUNDS = 10;

export type AdminSession = {
  userId: string;
  username: string;
  role: AdminRole;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export function getEnvAdminCredentials() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

function looksLikeBcryptHash(value: string) {
  return /^\$2[aby]?\$\d{2}\$/.test(value);
}

export async function hashPassword(password: string) {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (looksLikeBcryptHash(stored)) {
    return compare(password, stored);
  }
  // Legacy plaintext row — accept once, caller should re-hash
  return timingSafeEqualString(password, stored);
}

/**
 * Ensures env ADMIN_* exists in DB as an active SUPER_ADMIN.
 * Keeps the stored password hash in sync with ADMIN_PASSWORD on Vercel/local.
 */
export async function ensureBootstrapSuperAdmin() {
  const creds = getEnvAdminCredentials();
  if (!creds) return null;

  const existing = await prisma.user.findUnique({
    where: { username: creds.username },
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        username: creds.username,
        password: await hashPassword(creds.password),
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
  }

  const passwordMatches = await verifyPassword(
    creds.password,
    existing.password
  );

  if (
    existing.role === "SUPER_ADMIN" &&
    existing.isActive &&
    passwordMatches &&
    looksLikeBcryptHash(existing.password)
  ) {
    return existing;
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      role: "SUPER_ADMIN",
      isActive: true,
      password: passwordMatches && looksLikeBcryptHash(existing.password)
        ? undefined
        : await hashPassword(creds.password),
    },
  });
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<
  | { ok: true; user: { id: string; username: string; role: AdminRole } }
  | { ok: false; error: string; status: number }
> {
  const normalized = username.trim();
  if (!normalized || !password) {
    return { ok: false, error: "Username and password required", status: 400 };
  }

  await ensureBootstrapSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { username: normalized },
  });

  if (!user) {
    return { ok: false, error: "Invalid username or password", status: 401 };
  }

  let passwordOk = await verifyPassword(password, user.password);

  // Bootstrap account: always accept current env ADMIN_PASSWORD and re-hash
  const creds = getEnvAdminCredentials();
  if (
    !passwordOk &&
    creds &&
    timingSafeEqualString(normalized, creds.username) &&
    timingSafeEqualString(password, creds.password)
  ) {
    passwordOk = true;
  }

  if (!passwordOk) {
    return { ok: false, error: "Invalid username or password", status: 401 };
  }

  // Upgrade plaintext / drift env password to a fresh bcrypt hash
  if (
    !looksLikeBcryptHash(user.password) ||
    (creds &&
      timingSafeEqualString(normalized, creds.username) &&
      timingSafeEqualString(password, creds.password))
  ) {
    const stillMatchesHash =
      looksLikeBcryptHash(user.password) &&
      (await compare(password, user.password));
    if (!stillMatchesHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashPassword(password),
          ...(creds && timingSafeEqualString(normalized, creds.username)
            ? { role: "SUPER_ADMIN" as const, isActive: true }
            : {}),
        },
      });
    }
  }

  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!fresh.isActive) {
    return {
      ok: false,
      error: "Account pending approval. Ask a super admin to activate you.",
      status: 403,
    };
  }

  return {
    ok: true,
    user: { id: fresh.id, username: fresh.username, role: fresh.role },
  };
}

export async function createAdminToken(session: {
  userId: string;
  username: string;
  role: AdminRole;
}): Promise<string> {
  return new SignJWT({
    userId: session.userId,
    username: session.username,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId;
    const username = payload.username;
    const role = payload.role;
    if (typeof userId !== "string" || !userId) return null;
    if (typeof username !== "string" || !username) return null;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") return null;
    return { userId, username, role };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifyAdminToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireSuperAdminSession(): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

function isProductionHttps() {
  return (
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)
  );
}

export function sessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionHttps(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionHttps(),
    path: "/",
    maxAge: 0,
  };
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) {
    let out = 0;
    for (let i = 0; i < bufA.length; i++) out |= bufA[i]!;
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) mismatch |= bufA[i]! ^ bufB[i]!;
  return mismatch === 0;
}
