"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type CategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
};

type CategoryManagerProps = {
  initialCategories: CategoryRow[];
  onCategoriesChange?: (categories: CategoryRow[]) => void;
};

export function CategoryManager({
  initialCategories,
  onCategoriesChange,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  function publish(next: CategoryRow[]) {
    setCategories(next);
    onCategoriesChange?.(next);
  }

  function startEdit(row: CategoryRow) {
    setEditingId(row.id);
    setName(row.name);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "Could not update category");
          return;
        }
        const data = (await res.json()) as {
          category: {
            id: string;
            name: string;
            sortOrder: number;
            isActive: boolean;
            _count: { items: number };
          };
        };
        publish(
          categories.map((c) =>
            c.id === editingId
              ? {
                  id: data.category.id,
                  name: data.category.name,
                  sortOrder: data.category.sortOrder,
                  isActive: data.category.isActive,
                  itemCount: data.category._count.items,
                }
              : c
          )
        );
        cancelEdit();
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "Could not create category");
          return;
        }
        const data = (await res.json()) as {
          category: {
            id: string;
            name: string;
            sortOrder: number;
            isActive: boolean;
            _count: { items: number };
          };
        };
        publish([
          ...categories,
          {
            id: data.category.id,
            name: data.category.name,
            sortOrder: data.category.sortOrder,
            isActive: data.category.isActive,
            itemCount: data.category._count.items,
          },
        ]);
        setName("");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: CategoryRow) {
    setBusyId(row.id);
    const res = await fetch(`/api/admin/categories/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as {
      category: { isActive: boolean };
    };
    publish(
      categories.map((c) =>
        c.id === row.id ? { ...c, isActive: data.category.isActive } : c
      )
    );
    router.refresh();
  }

  async function remove(row: CategoryRow) {
    if (row.itemCount > 0) {
      setError(`“${row.name}” still has ${row.itemCount} item(s). Move them first.`);
      return;
    }
    setBusyId(row.id);
    const res = await fetch(`/api/admin/categories/${row.id}`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not delete");
      return;
    }
    if (editingId === row.id) cancelEdit();
    publish(categories.filter((c) => c.id !== row.id));
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog text-canvas">
      <div className="border-b border-canvas/10 px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
          Organize
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Categories
        </h2>
        <p className="mt-1 text-sm text-canvas/45">
          Create groups for the customer menu, then assign items below.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex flex-col gap-3 border-b border-canvas/10 px-5 py-4 sm:flex-row sm:items-end"
      >
        <label className="block min-w-0 flex-1">
          <span className="mb-1.5 block text-sm font-medium text-canvas/75">
            {editingId ? "Edit category" : "New category"}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input-dark"
            placeholder="e.g. Snacks, Drinks"
            required
          />
        </label>
        <div className="flex gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="cursor-pointer rounded-xl border border-canvas/15 px-3 py-2.5 text-sm font-medium text-canvas/70 transition hover:bg-canvas/5"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update" : "Add category"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="px-5 pt-3 text-sm font-medium text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-canvas/8">
        {categories.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-canvas/40">
            No categories yet.
          </li>
        ) : (
          categories.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-canvas/40">
                  {row.itemCount} item{row.itemCount === 1 ? "" : "s"}
                  {!row.isActive ? " · hidden" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className="cursor-pointer rounded-xl border border-canvas/15 px-2.5 py-1.5 text-xs font-semibold text-canvas/75 transition hover:bg-canvas/5 hover:text-canvas"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void toggleActive(row)}
                  className="cursor-pointer rounded-xl border border-canvas/15 px-2.5 py-1.5 text-xs font-semibold text-canvas/75 transition hover:bg-canvas/5 disabled:opacity-50"
                >
                  {row.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id || row.itemCount > 0}
                  onClick={() => void remove(row)}
                  className="cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-semibold text-canvas/40 transition hover:bg-canvas/5 hover:text-red-400 disabled:opacity-40"
                  title={
                    row.itemCount > 0
                      ? "Move items out of this category first"
                      : "Delete category"
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="border-t border-canvas/8 px-5 py-3 text-xs text-canvas/35">
        Delete is soft — history stays; recreate the same name to restore.
      </p>
    </section>
  );
}
