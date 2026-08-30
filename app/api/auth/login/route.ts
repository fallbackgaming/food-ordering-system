import {
  authenticateAdmin,
  clearSessionCookieOptions,
  createAdminToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const result = await authenticateAdmin(
      body.username ?? "",
      body.password ?? ""
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const token = await createAdminToken({
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
    });
    const jar = await cookies();
    jar.set(sessionCookieOptions(token));

    return NextResponse.json({
      ok: true,
      role: result.user.role,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Login is not configured" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
