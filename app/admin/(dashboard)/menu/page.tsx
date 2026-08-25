import { MenuManager } from "@/components/admin/menu-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
        <p className="mt-1 text-sm text-ink/55">
          Add items, edit prices, and toggle availability.
        </p>
      </div>
      <MenuManager
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
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
