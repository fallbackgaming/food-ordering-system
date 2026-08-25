import { OrdersBoard } from "@/components/admin/orders-board";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { station: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
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
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-ink/55">
          Live board — update status as you prepare and deliver.
        </p>
      </div>
      <OrdersBoard initialOrders={serialized} />
    </div>
  );
}
