"use client";

import { formatPrice } from "@/lib/format";
import { FormEvent, useMemo, useState } from "react";
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

const emptyForm = (categoryId: string) => ({
  name: "",
  description: "",
  priceRupees: "",
  emoji: "",
  categoryId,
  isAvailable: true,
});

export function MenuManager({ initialItems, categories }: MenuManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(categories[0]?.id ?? ""));

  const stats = useMemo(() => {
    const available = items.filter((i) => i.isAvailable).length;
    return {
      total: items.length,
      available,
      unavailable: items.length - available,
    };
  }, [items]);

  async function toggleAvailable(item: MenuRow) {
    setBusyId(item.id);
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { item: { isAvailable: boolean } };
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? { ...row, isAvailable: data.item.isAvailable }
          : row
      )
    );
    router.refresh();
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const rupees = Number(form.priceRupees);
    if (!form.name.trim() || Number.isNaN(rupees) || rupees < 0) {
      setError("Enter a valid name and price.");
      return;
    }
    if (!form.categoryId) {
      setError("Select a category.");
      return;
    }

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
        isAvailable: form.isAvailable,
      }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not add item.");
      return;
    }

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
      ...prev,
    ]);
    setForm(emptyForm(form.categoryId));
    setSuccess(`Added “${data.item.name}” to the menu.`);
    router.refresh();
  }

  return (
    <div className="space-y-6 text-canvas">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total items" value={String(stats.total)} />
        <Stat label="Available" value={String(stats.available)} />
        <Stat label="Unavailable" value={String(stats.unavailable)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="h-fit overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
          <div className="border-b border-canvas/10 px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
              Catalog
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Add menu item
            </h2>
            <p className="mt-1 text-sm text-canvas/45">
              Fill the form and save to publish on the customer menu.
            </p>
          </div>

          <form onSubmit={onCreate} className="space-y-4 px-5 py-5">
            <Field label="Item name" htmlFor="item-name">
              <input
                id="item-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="field-input-dark"
                placeholder="e.g. Classic Burger"
                required
              />
            </Field>

            <Field label="Description" htmlFor="item-description">
              <textarea
                id="item-description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="field-input-dark resize-y"
                placeholder="Short description for customers"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)" htmlFor="item-price">
                <input
                  id="item-price"
                  inputMode="decimal"
                  value={form.priceRupees}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceRupees: e.target.value }))
                  }
                  className="field-input-dark"
                  placeholder="149"
                  required
                />
              </Field>
              <Field label="Emoji" htmlFor="item-emoji">
                <input
                  id="item-emoji"
                  value={form.emoji}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emoji: e.target.value }))
                  }
                  className="field-input-dark"
                  placeholder="🍔"
                />
              </Field>
            </div>

            <Field label="Category" htmlFor="item-category">
              <select
                id="item-category"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="field-input-dark"
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </Field>

            <label className="flex items-center gap-2 text-sm text-canvas/75">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAvailable: e.target.checked }))
                }
                className="size-4 rounded border-canvas/20 accent-accent"
              />
              Available immediately
            </label>

            {error ? (
              <p className="text-sm font-medium text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm font-medium text-accent" role="status">
                {success}
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm(form.categoryId));
                  setError(null);
                  setSuccess(null);
                }}
                className="flex-1 cursor-pointer rounded-xl border border-canvas/15 px-3 py-2.5 text-sm font-medium text-canvas/70 transition hover:bg-canvas/5 hover:text-canvas"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={creating || !form.categoryId}
                className="flex-[1.4] cursor-pointer rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Saving…" : "Save item"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
          <div className="flex items-center justify-between gap-3 border-b border-canvas/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
                Live menu
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                Menu catalog
              </h2>
              <p className="mt-1 text-sm text-canvas/45">
                Toggle availability without deleting items.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-ink/60 text-xs uppercase tracking-wide text-canvas/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas/8">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-canvas/40"
                    >
                      No menu items yet. Use the form to add one.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={!item.isAvailable ? "bg-ink/30" : undefined}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas/10 text-xl"
                            aria-hidden
                          >
                            {item.emoji || "•"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-canvas">
                              {item.name}
                            </p>
                            <p className="truncate text-xs text-canvas/40">
                              {item.description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-canvas/60">
                        {item.categoryName}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums text-canvas">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.isAvailable
                              ? "bg-accent/20 text-accent"
                              : "bg-canvas/10 text-canvas/45"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void toggleAvailable(item)}
                          className="cursor-pointer rounded-xl border border-canvas/15 px-2.5 py-1.5 text-xs font-semibold text-canvas/75 transition hover:bg-canvas/5 hover:text-canvas disabled:opacity-50"
                        >
                          {item.isAvailable ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-canvas/10 bg-fog px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-canvas/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-canvas">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-medium text-canvas/75">
        {label}
      </span>
      {children}
    </label>
  );
}
