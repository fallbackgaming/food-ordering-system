import { AdminMenuClient } from "@/components/admin/admin-menu-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { items: { where: { deletedAt: null } } } },
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Catalog
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          Menu
        </h1>
        <p className="mt-1 text-sm text-canvas/50">
          Manage categories and items — edit anytime, control what customers
          see.
        </p>
      </div>
      <AdminMenuClient
        initialItems={items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          emoji: item.emoji,
          isAvailable: item.isAvailable,
          categoryId: item.categoryId,
          categoryName: item.category.name,
        }))}
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          itemCount: c._count.items,
        }))}
      />
    </div>
  );
}
