import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

type Scope = "all" | "active" | "completed";

function parseScope(value: string | null): Scope {
  if (value === "active" || value === "completed" || value === "all") {
    return value;
  }
  return "all";
}

function scopeWhere(scope: Scope): Prisma.OrderWhereInput | undefined {
  if (scope === "active") {
    return { status: { notIn: ["DELIVERED", "CANCELLED"] } };
  }
  if (scope === "completed") {
    return { status: { in: ["DELIVERED", "CANCELLED"] } };
  }
  return undefined;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT)
  );
  const cursor = searchParams.get("cursor") ?? undefined;
  const scope = parseScope(searchParams.get("scope"));
  const where = scopeWhere(scope);

  const rows = await prisma.order.findMany({
    where,
    include: {
      station: true,
      items: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [activeCount, completedCount, todayOrders] = await Promise.all([
    prisma.order.count({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
    }),
    prisma.order.count({
      where: { status: { in: ["DELIVERED", "CANCELLED"] } },
    }),
    prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfDay },
      },
      select: { totalAmount: true },
    }),
  ]);

  const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return NextResponse.json({
    orders: page.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      customerNote: order.customerNote,
      createdAt: order.createdAt.toISOString(),
      station: {
        name: order.station.name,
        type: order.station.type,
        number: order.station.number,
      },
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    })),
    nextCursor,
    hasMore,
    scope,
    stats: {
      activeCount,
      completedCount,
      revenueToday,
    },
  });
}
