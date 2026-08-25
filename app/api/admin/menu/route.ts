import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ items, categories });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    price?: number;
    emoji?: string;
    categoryId?: string;
    categoryName?: string;
    isAvailable?: boolean;
  };

  if (!body.name?.trim() || typeof body.price !== "number" || body.price < 0) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  let categoryId = body.categoryId;
  if (!categoryId && body.categoryName?.trim()) {
    const category = await prisma.category.upsert({
      where: { name: body.categoryName.trim() },
      create: {
        name: body.categoryName.trim(),
        sortOrder: 99,
      },
      update: {},
    });
    categoryId = category.id;
  }

  if (!categoryId) {
    return NextResponse.json({ error: "Category required" }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      price: Math.round(body.price),
      emoji: body.emoji?.trim() ?? "",
      categoryId,
      isAvailable: body.isAvailable ?? true,
    },
    include: { category: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}
