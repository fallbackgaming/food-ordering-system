import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Soft-delete station — keeps order history. */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const station = await prisma.station.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return NextResponse.json({ station, ok: true });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    isActive?: boolean;
    restore?: boolean;
  };

  if (body.restore) {
    const station = await prisma.station.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
    return NextResponse.json({ station });
  }

  const station = await prisma.station.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(typeof body.isActive === "boolean"
        ? { isActive: body.isActive }
        : {}),
    },
  });

  return NextResponse.json({ station });
}
