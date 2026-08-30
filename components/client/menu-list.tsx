"use client";

import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type MenuListProps = {
  items: MenuItem[];
  quantities: Record<string, number>;
  onAdd: (item: MenuItem) => void;
  onDecrement: (itemId: string) => void;
};

function groupByCategory(items: MenuItem[]) {
  const order: string[] = [];
  const groups = new Map<string, MenuItem[]>();

  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
      order.push(item.category);
    }
    groups.get(item.category)!.push(item);
  }

  return order.map((category) => ({
    category,
    items: groups.get(category)!,
  }));
}

export function MenuList({
  items,
  quantities,
  onAdd,
  onDecrement,
}: MenuListProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const item of items) {
      if (!seen.includes(item.category)) seen.push(item.category);
    }
    return seen;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, query, activeCategory]);

  const sections = groupByCategory(filtered);

  useEffect(() => {
    if (activeCategory === "all") return;
    const el = sectionRefs.current[activeCategory];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeCategory]);

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-30 -mx-4 space-y-3 bg-ink/90 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/80">
        <label className="relative block">
          <span className="sr-only">Search menu</span>
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
            aria-hidden
          >
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search burgers, drinks, desserts…"
            className="w-full rounded-2xl border border-transparent bg-canvas py-3.5 pl-10 pr-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ink/45 hover:bg-ink/5 hover:text-ink"
            >
              Clear
            </button>
          ) : null}
        </label>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={activeCategory === category}
              onClick={() =>
                setActiveCategory((prev) =>
                  prev === category ? "all" : category
                )
              }
            />
          ))}
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-canvas/15 bg-fog px-4 py-12 text-center">
          <p className="font-medium text-canvas">No matches</p>
          <p className="mt-1 text-sm text-canvas/50">
            Try another search or category.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(({ category, items: sectionItems }, sectionIndex) => (
            <section
              key={category}
              id={`cat-${category}`}
              ref={(node) => {
                sectionRefs.current[category] = node;
              }}
              aria-labelledby={`heading-${category}`}
              className="scroll-mt-36"
            >
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2
                  id={`heading-${category}`}
                  className="text-lg font-semibold tracking-tight text-canvas"
                >
                  {category}
                </h2>
                <span className="text-xs text-canvas/40">
                  {sectionItems.filter((i) => i.isAvailable).length} available
                </span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {sectionItems.map((item, index) => {
                  const qty = quantities[item.id] ?? 0;
                  const unavailable = !item.isAvailable;

                  return (
                    <li
                      key={item.id}
                      className="animate-fade-up"
                      style={{
                        animationDelay: `${Math.min(sectionIndex * 40 + index * 35, 280)}ms`,
                      }}
                    >
                      <article
                        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-canvas p-3.5 text-ink shadow-[0_1px_0_rgba(255,255,255,0.04)] transition duration-200 ${
                          unavailable
                            ? "border-transparent opacity-50"
                            : qty > 0
                              ? "border-accent/55 shadow-[0_10px_30px_rgba(30,202,211,0.16)]"
                              : "border-transparent hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-panel to-[#ebebeb] text-3xl shadow-inner"
                            aria-hidden
                          >
                            {item.emoji || "•"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold leading-snug tracking-tight">
                                {item.name}
                              </h3>
                              <p className="shrink-0 font-semibold tabular-nums text-ink">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink/55">
                              {item.description || "Staff favorite"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          {unavailable ? (
                            <span className="text-xs font-medium uppercase tracking-wide text-ink/40">
                              Sold out
                            </span>
                          ) : qty > 0 ? (
                            <span className="text-xs font-medium text-accent">
                              In cart · {qty}
                            </span>
                          ) : (
                            <span className="text-xs text-ink/35">Tap to add</span>
                          )}

                          {unavailable ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-xl bg-ink/8 px-3.5 py-2 text-sm font-medium text-ink/35"
                            >
                              Unavailable
                            </button>
                          ) : qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => onAdd(item)}
                              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-ink/90 active:scale-[0.97]"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-panel p-1">
                              <button
                                type="button"
                                aria-label={`Remove one ${item.name}`}
                                onClick={() => onDecrement(item.id)}
                                className="flex size-9 items-center justify-center rounded-lg text-lg leading-none transition hover:bg-white active:scale-95"
                              >
                                −
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Add one ${item.name}`}
                                onClick={() => onAdd(item)}
                                className="flex size-9 items-center justify-center rounded-lg bg-accent text-lg leading-none text-ink transition hover:brightness-95 active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-accent text-ink shadow-sm"
          : "border border-canvas/15 bg-fog text-canvas/70 hover:border-canvas/30 hover:text-canvas"
      }`}
    >
      {label}
    </button>
  );
}
