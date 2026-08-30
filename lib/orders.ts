import { ensureStation } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { PaymentMethod, StationType } from "@/lib/generated/prisma/client";

export type PlaceOrderInput = {
  stationType: StationType;
  stationNumber: number;
  customerName: string;
  paymentMethod: Extract<PaymentMethod, "cash" | "upi">;
  customerNote?: string | null;
  items: Array<{ menuItemId: string; quantity: number }>;
  /** When admin places, cash can skip pending and go straight to PAID if desired — keep same rules */
  placedByAdmin?: boolean;
};

export type PlaceOrderResult =
  | { ok: true; order: Awaited<ReturnType<typeof createOrderRecord>> }
  | { ok: false; status: number; error: string };

async function createOrderRecord(data: {
  stationId: string;
  customerName: string;
  status: "PENDING_PAYMENT" | "PAID";
  paymentMethod: PaymentMethod;
  totalAmount: number;
  customerNote: string | null;
  lines: Array<{
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }>;
}) {
  return prisma.order.create({
    data: {
      stationId: data.stationId,
      customerName: data.customerName,
      status: data.status,
      paymentMethod: data.paymentMethod,
      totalAmount: data.totalAmount,
      customerNote: data.customerNote,
      items: {
        create: data.lines.map((line) => ({
          menuItemId: line.menuItemId,
          name: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      },
    },
    include: { station: true, items: true },
  });
}

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const customerName = input.customerName.trim();
  if (!customerName) {
    return { ok: false, status: 400, error: "Name is required" };
  }

  if (
    (input.stationType !== "pc" && input.stationType !== "ps") ||
    !Number.isInteger(input.stationNumber) ||
    input.stationNumber < 1
  ) {
    return { ok: false, status: 400, error: "Invalid station" };
  }

  if (input.paymentMethod !== "cash" && input.paymentMethod !== "upi") {
    return { ok: false, status: 400, error: "Invalid payment method" };
  }

  if (!input.items.length) {
    return { ok: false, status: 400, error: "Cart is empty" };
  }

  const menuIds = input.items.map((i) => i.menuItemId);
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

  for (const line of input.items) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { ok: false, status: 400, error: "Invalid quantity" };
    }
    const item = byId.get(line.menuItemId);
    if (!item) {
      return { ok: false, status: 400, error: "Item unavailable" };
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

  const station = await ensureStation(input.stationType, input.stationNumber);

  // Cash on delivery stays pending; UPI and admin cash-desk can mark paid
  const status =
    input.paymentMethod === "upi" || input.placedByAdmin
      ? "PAID"
      : "PENDING_PAYMENT";

  const order = await createOrderRecord({
    stationId: station.id,
    customerName,
    status,
    paymentMethod: input.paymentMethod,
    totalAmount,
    customerNote: input.customerNote?.trim() || null,
    lines,
  });

  return { ok: true, order };
}
