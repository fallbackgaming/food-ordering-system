import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A category with that name already exists" },
      { status: 409 }
    );
  }

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.round(body.sortOrder)
      : (maxSort._max.sortOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: {
      name,
      sortOrder,
      isActive: body.isActive ?? true,
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ category }, { status: 201 });
}
