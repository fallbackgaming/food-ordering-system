import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    price?: number;
    emoji?: string;
    isAvailable?: boolean;
    categoryId?: string;
  };

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim() }
        : {}),
      ...(typeof body.price === "number"
        ? { price: Math.round(body.price) }
        : {}),
      ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
      ...(typeof body.isAvailable === "boolean"
        ? { isAvailable: body.isAvailable }
        : {}),
      ...(body.categoryId ? { categoryId: body.categoryId } : {}),
    },
    include: { category: true },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
