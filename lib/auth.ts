import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "cafe_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminSession = {
  username: string;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set");
  }
  return { username, password };
}

export async function createAdminToken(username: string): Promise<string> {
  return new SignJWT({ username })
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
    const username = payload.username;
    if (typeof username !== "string" || !username) return null;
    return { username };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function sessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
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
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) {
    // still compare to reduce timing leaks on length
    let out = 0;
    for (let i = 0; i < bufA.length; i++) out |= bufA[i];
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) mismatch |= bufA[i] ^ bufB[i];
  return mismatch === 0;
}
