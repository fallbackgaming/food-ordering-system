import { ensureStation } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { StationType } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

const ACTIVE_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
] as const;

/**
 * Public: active orders for a station (QR / open menu page).
 * Same station identity customers already use to place orders.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawType = (searchParams.get("stationType") ?? "").toLowerCase();
  const stationNumber = Number(searchParams.get("stationNumber"));

  if (
    (rawType !== "pc" && rawType !== "ps") ||
    !Number.isInteger(stationNumber) ||
    stationNumber < 1
  ) {
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });
  }

  const stationType = rawType as StationType;
  const station = await ensureStation(stationType, stationNumber);

  const orders = await prisma.order.findMany({
    where: {
      stationId: station.id,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  return NextResponse.json({
    station: {
      id: station.id,
      name: station.name,
      type: station.type,
      number: station.number,
    },
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      createdAt: order.createdAt.toISOString(),
      items: order.items,
    })),
  });
}
