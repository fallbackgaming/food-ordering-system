import {
  clearSessionCookieOptions,
  createAdminToken,
  getAdminCredentials,
  sessionCookieOptions,
  timingSafeEqualString,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const creds = getAdminCredentials();
    console.log("----------------------->", creds);

    const userOk = timingSafeEqualString(username, creds.username);
    const passOk = timingSafeEqualString(password, creds.password);

    if (!userOk || !passOk) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const token = await createAdminToken(username);
    const jar = await cookies();
    jar.set(sessionCookieOptions(token));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Login is not configured" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
