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
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { items: { where: { deletedAt: null } } } },
    },
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

  const existing = await prisma.category.findFirst({
    where: { name, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A category with that name already exists" },
      { status: 409 }
    );
  }

  // Soft-deleted row with same unique name: revive it instead of failing unique
  const softDeleted = await prisma.category.findFirst({
    where: { name, deletedAt: { not: null } },
  });
  if (softDeleted) {
    const revived = await prisma.category.update({
      where: { id: softDeleted.id },
      data: {
        deletedAt: null,
        isActive: body.isActive ?? true,
        sortOrder:
          typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
            ? Math.round(body.sortOrder)
            : softDeleted.sortOrder,
      },
      include: {
        _count: { select: { items: { where: { deletedAt: null } } } },
      },
    });
    return NextResponse.json({ category: revived }, { status: 201 });
  }

  const maxSort = await prisma.category.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });
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
    include: {
      _count: { select: { items: { where: { deletedAt: null } } } },
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
