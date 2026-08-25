import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

const ALLOWED: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

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
  const body = (await request.json()) as { status?: string };
  const status = body.status;

  if (!status || !ALLOWED.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
    include: { station: true, items: true },
  });

  return NextResponse.json({ order });
}
