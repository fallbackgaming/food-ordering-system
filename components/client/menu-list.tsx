"use client";

import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

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
  const sections = groupByCategory(items);

  return (
    <div className="space-y-10">
      {sections.map(({ category, items: sectionItems }) => (
        <section key={category} aria-labelledby={`cat-${category}`}>
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-ink/10 pb-2">
            <h2
              id={`cat-${category}`}
              className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55"
            >
              {category}
            </h2>
            <span className="text-xs text-ink/35">
              {sectionItems.filter((i) => i.isAvailable).length} available
            </span>
          </div>

          <ul className="space-y-3">
            {sectionItems.map((item) => {
              const qty = quantities[item.id] ?? 0;
              const unavailable = !item.isAvailable;

              return (
                <li
                  key={item.id}
                  className={`group relative overflow-hidden rounded-xl border border-ink/8 bg-white/70 px-3 py-3 transition duration-200 ${
                    unavailable
                      ? "opacity-45"
                      : "hover:border-accent/40 hover:bg-white"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent transition-opacity duration-200 ${
                      qty > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    }`}
                    aria-hidden
                  />

                  <div className="flex items-stretch gap-3 pl-1">
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04] text-3xl"
                      aria-hidden
                    >
                      {item.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold tracking-tight text-ink">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink/60">
                            {item.description}
                          </p>
                        </div>
                        <p className="shrink-0 pt-0.5 font-semibold tabular-nums text-ink">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-3">
                        {unavailable ? (
                          <span className="mr-auto text-xs font-medium uppercase tracking-wide text-ink/45">
                            Unavailable
                          </span>
                        ) : null}

                        {unavailable ? (
                          <button
                            type="button"
                            disabled
                            className="rounded-lg bg-ink/10 px-3 py-1.5 text-sm font-medium text-ink/40"
                          >
                            Add
                          </button>
                        ) : qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => onAdd(item)}
                            className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-canvas transition hover:bg-ink/90 active:scale-[0.98]"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 rounded-lg border border-ink/15 bg-canvas p-0.5">
                            <button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => onDecrement(item.id)}
                              className="flex size-8 items-center justify-center rounded-md text-lg leading-none text-ink transition hover:bg-ink/5 active:scale-95"
                            >
                              −
                            </button>
                            <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() => onAdd(item)}
                              className="flex size-8 items-center justify-center rounded-md bg-accent text-lg leading-none text-ink transition hover:brightness-95 active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
