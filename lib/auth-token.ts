import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "cafe_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 18; // 18 hours

export type AdminTokenPayload = {
  userId: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

/** Accepts AUTH_SECRET (preferred) or common aliases. */
export function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET must be set in Vercel env (min 16 characters)"
    );
  }
  return secret;
}

function getSecretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

/** Edge-safe — no Prisma / Node-only imports. */
export async function createAdminToken(
  session: AdminTokenPayload
): Promise<string> {
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

/** Edge-safe — used by proxy/middleware. */
export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
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
    expires: new Date(0),
  };
}
