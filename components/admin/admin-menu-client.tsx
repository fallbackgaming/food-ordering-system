"use client";

import { CategoryManager, type CategoryRow } from "@/components/admin/category-manager";
import { MenuManager } from "@/components/admin/menu-manager";
import { useEffect, useMemo, useState } from "react";

type MenuRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
};

type AdminMenuClientProps = {
  initialItems: MenuRow[];
  initialCategories: CategoryRow[];
};

export function AdminMenuClient({
  initialItems,
  initialCategories,
}: AdminMenuClientProps) {
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const allCategoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  return (
    <div className="space-y-6">
      <CategoryManager
        initialCategories={categories}
        onCategoriesChange={setCategories}
      />
      <MenuManager
        initialItems={initialItems}
        categories={allCategoryOptions}
      />
    </div>
  );
}
