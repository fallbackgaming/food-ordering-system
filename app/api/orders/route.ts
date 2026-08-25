import { ensureStation } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { PaymentMethod, StationType } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

type OrderBody = {
  stationType?: string;
  stationNumber?: number;
  paymentMethod?: string;
  customerNote?: string;
  items?: Array<{
    menuItemId: string;
    quantity: number;
  }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as OrderBody;

  const stationType = body.stationType?.toLowerCase();
  const stationNumber = body.stationNumber;
  const paymentMethod = body.paymentMethod;

  if (
    (stationType !== "pc" && stationType !== "ps") ||
    !Number.isInteger(stationNumber) ||
    !stationNumber ||
    stationNumber < 1
  ) {
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });
  }

  if (paymentMethod !== "cash" && paymentMethod !== "upi") {
    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 }
    );
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const menuIds = body.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuIds }, isAvailable: true },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: Array<{
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }> = [];

  for (const line of body.items) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    const item = byId.get(line.menuItemId);
    if (!item) {
      return NextResponse.json(
        { error: "Item unavailable" },
        { status: 400 }
      );
    }
    lines.push({
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: line.quantity,
    });
  }

  const totalAmount = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  const station = await ensureStation(
    stationType as StationType,
    stationNumber
  );

  const status = paymentMethod === "upi" ? "PAID" : "PENDING_PAYMENT";

  const order = await prisma.order.create({
    data: {
      stationId: station.id,
      status,
      paymentMethod: paymentMethod as PaymentMethod,
      totalAmount,
      customerNote: body.customerNote?.trim() || null,
      items: {
        create: lines.map((line) => ({
          menuItemId: line.menuItemId,
          name: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      },
    },
    include: { station: true, items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
