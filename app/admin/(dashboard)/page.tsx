import { OrdersBoard } from "@/components/admin/orders-board";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function AdminOrdersPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [orders, activeCount, completedCount, todayOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: { station: true, items: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
    }),
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

  const hasMore = orders.length > PAGE_SIZE;
  const page = hasMore ? orders.slice(0, PAGE_SIZE) : orders;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Kitchen
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          Orders
        </h1>
        <p className="mt-1 text-sm text-canvas/50">
          Live kitchen board — tap Completed to review finished tickets.
        </p>
      </div>
      <OrdersBoard
        initialOrders={page.map((order) => ({
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
        }))}
        initialCursor={nextCursor}
        initialHasMore={hasMore}
        initialStats={{
          activeCount,
          completedCount,
          revenueToday,
        }}
      />
    </div>
  );
}
