import { requireAdminSession } from "@/lib/auth";
import { placeOrder } from "@/lib/orders";
import type { PaymentMethod, StationType } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

type AdminOrderBody = {
  stationType?: string;
  stationNumber?: number;
  customerName?: string;
  paymentMethod?: string;
  customerNote?: string;
  items?: Array<{
    menuItemId: string;
    quantity: number;
  }>;
};

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AdminOrderBody;

  const result = await placeOrder({
    stationType: (body.stationType?.toLowerCase() ?? "") as StationType,
    stationNumber: Number(body.stationNumber),
    customerName: body.customerName ?? "",
    paymentMethod: body.paymentMethod as Extract<PaymentMethod, "cash" | "upi">,
    customerNote: body.customerNote,
    items: body.items ?? [],
    placedByAdmin: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
