import { AdminPlaceOrderForm } from "@/components/admin/place-order-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPlaceOrderPage() {
  const [stations, menuItems] = await Promise.all([
    prisma.station.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { number: "asc" }],
    }),
    prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Desk
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          Place order
        </h1>
        <p className="mt-1 text-sm text-canvas/50">
          Create an order for a customer at a station — name required.
        </p>
      </div>
      <AdminPlaceOrderForm
        stations={stations.map((s) => ({
          id: s.id,
          type: s.type,
          number: s.number,
          name: s.name,
        }))}
        menuItems={menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          emoji: item.emoji,
          categoryName: item.category.name,
          isAvailable: item.isAvailable,
        }))}
      />
    </div>
  );
}
