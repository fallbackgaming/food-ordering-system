import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { AdminRole } from "@/lib/generated/prisma/client";
import {
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  verifyAdminToken,
  sessionCookieOptions,
  clearSessionCookieOptions,
  getAuthSecret,
} from "@/lib/auth-token";

export {
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  verifyAdminToken,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from "@/lib/auth-token";

const BCRYPT_ROUNDS = 10;

export type AdminSession = {
  userId: string;
  username: string;
  role: AdminRole;
};

export function assertAuthConfigured() {
  getAuthSecret();
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL (or DIRECT_URL) must be set in Vercel environment variables"
    );
  }
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
  return timingSafeEqualString(password, stored);
}

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
      password:
        passwordMatches && looksLikeBcryptHash(existing.password)
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

  assertAuthConfigured();
  await ensureBootstrapSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { username: normalized },
  });

  if (!user) {
    return { ok: false, error: "Invalid username or password", status: 401 };
  }

  let passwordOk = await verifyPassword(password, user.password);

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

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
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
  } catch (error) {
    console.error("getAdminSession failed", error);
    return null;
  }
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
