"use client";

import { formatPrice } from "@/lib/format";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

type CategoryOption = { id: string; name: string };

type MenuManagerProps = {
  initialItems: MenuRow[];
  categories: CategoryOption[];
};

export function MenuManager({ initialItems, categories }: MenuManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceRupees: "",
    emoji: "",
    categoryId: categories[0]?.id ?? "",
  });

  async function toggleAvailable(item: MenuRow) {
    setBusyId(item.id);
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { item: MenuRow & { category?: { name: string } } };
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? {
              ...row,
              isAvailable: data.item.isAvailable,
            }
          : row
      )
    );
    router.refresh();
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const rupees = Number(form.priceRupees);
    if (!form.name.trim() || Number.isNaN(rupees) || rupees < 0) return;

    setCreating(true);
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Math.round(rupees * 100),
        emoji: form.emoji,
        categoryId: form.categoryId,
        isAvailable: true,
      }),
    });
    setCreating(false);
    if (!res.ok) return;

    const data = (await res.json()) as {
      item: {
        id: string;
        name: string;
        description: string;
        price: number;
        emoji: string;
        isAvailable: boolean;
        categoryId: string;
        category: { name: string };
      };
    };

    setItems((prev) => [
      ...prev,
      {
        id: data.item.id,
        name: data.item.name,
        description: data.item.description,
        price: data.item.price,
        emoji: data.item.emoji,
        isAvailable: data.item.isAvailable,
        categoryId: data.item.categoryId,
        categoryName: data.item.category.name,
      },
    ]);
    setForm({
      name: "",
      description: "",
      priceRupees: "",
      emoji: "",
      categoryId: form.categoryId,
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-ink/10 bg-white p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink/45">
          Add item
        </h2>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-ink/15 px-3 py-2 outline-none ring-accent focus:ring-2"
          required
        />
        <input
          placeholder="Price (₹)"
          inputMode="decimal"
          value={form.priceRupees}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceRupees: e.target.value }))
          }
          className="rounded-lg border border-ink/15 px-3 py-2 outline-none ring-accent focus:ring-2"
          required
        />
        <input
          placeholder="Emoji (optional)"
          value={form.emoji}
          onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
          className="rounded-lg border border-ink/15 px-3 py-2 outline-none ring-accent focus:ring-2"
        />
        <select
          value={form.categoryId}
          onChange={(e) =>
            setForm((f) => ({ ...f, categoryId: e.target.value }))
          }
          className="rounded-lg border border-ink/15 px-3 py-2 outline-none ring-accent focus:ring-2"
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="sm:col-span-2 rounded-lg border border-ink/15 px-3 py-2 outline-none ring-accent focus:ring-2"
        />
        <button
          type="submit"
          disabled={creating || !form.categoryId}
          className="sm:col-span-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {creating ? "Adding…" : "Add to menu"}
        </button>
      </form>

      <ul className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
              item.isAvailable ? "" : "opacity-55"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {item.emoji || "•"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {item.name}{" "}
                <span className="text-xs font-medium uppercase tracking-wide text-ink/40">
                  {item.categoryName}
                </span>
              </p>
              <p className="truncate text-sm text-ink/55">{item.description}</p>
            </div>
            <p className="font-semibold tabular-nums">
              {formatPrice(item.price)}
            </p>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void toggleAvailable(item)}
              className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5 disabled:opacity-50"
            >
              {item.isAvailable ? "Mark unavailable" : "Mark available"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
