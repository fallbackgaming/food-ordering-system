import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      station: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}
