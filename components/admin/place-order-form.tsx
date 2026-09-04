"use client";

import { formatPrice } from "@/lib/format";
import type { StationType } from "@/lib/types";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StationOption = {
  id: string;
  type: StationType;
  number: number;
  name: string;
};

type MenuOption = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  categoryName: string;
  isAvailable: boolean;
};

type AdminPlaceOrderProps = {
  stations: StationOption[];
  menuItems: MenuOption[];
};

export function AdminPlaceOrderForm({
  stations,
  menuItems,
}: AdminPlaceOrderProps) {
  const router = useRouter();
  const [stationKey, setStationKey] = useState(
    stations[0] ? `${stations[0].type}:${stations[0].number}` : ""
  );
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash">("cash");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = useMemo(() => {
    const [type, num] = stationKey.split(":");
    return stations.find(
      (s) => s.type === type && String(s.number) === num
    );
  }, [stationKey, stations]);

  const lines = useMemo(
    () =>
      menuItems
        .filter((item) => (qty[item.id] ?? 0) > 0)
        .map((item) => ({
          item,
          quantity: qty[item.id]!,
        })),
    [menuItems, qty]
  );

  const total = lines.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  );

  function setItemQty(id: string, next: number) {
    setQty((prev) => {
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected) {
      setError("Select a station");
      return;
    }
    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one menu item");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/orders/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationType: selected.type,
        stationNumber: selected.number,
        customerName: customerName.trim(),
        paymentMethod,
        customerNote: note.trim() || undefined,
        items: lines.map((line) => ({
          menuItemId: line.item.id,
          quantity: line.quantity,
        })),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not place order");
      return;
    }

    const data = (await res.json()) as {
      order: { orderNumber: number };
    };
    setSuccess(
      `Order #${data.order.orderNumber} placed for ${customerName.trim()}`
    );
    setCustomerName("");
    setNote("");
    setQty({});
    router.push("/admin");
    router.refresh();
  }

  if (stations.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-canvas/15 bg-fog px-4 py-10 text-center text-sm text-canvas/50">
        Create a station QR first, then place orders here.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 text-canvas lg:grid-cols-[1fr_320px]"
    >
      <section className="space-y-4 rounded-2xl border border-canvas/10 bg-fog p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-canvas/75">
              Customer name <span className="text-accent">*</span>
            </span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="field-input-dark"
              placeholder="Customer name"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-canvas/75">
              Station
            </span>
            <select
              value={stationKey}
              onChange={(e) => setStationKey(e.target.value)}
              className="field-input-dark"
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={`${s.type}:${s.number}`}>
                  {s.name} ({s.type.toUpperCase()} {s.number})
                </option>
              ))}
            </select>
          </label>

          <div className="block">
            <span className="mb-1.5 block text-sm font-medium text-canvas/75">
              Payment
            </span>
            <p className="rounded-xl border border-canvas/10 bg-ink px-3 py-2.5 text-sm text-canvas/80">
              Cash
            </p>
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-canvas/75">
              Note (optional)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field-input-dark"
              placeholder="Extra spicy, no onion…"
            />
          </label>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-canvas/40">
            Menu items
          </h2>
          <ul className="divide-y divide-canvas/8 overflow-hidden rounded-2xl border border-canvas/10 bg-ink">
            {menuItems.map((item) => {
              const count = qty[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 px-3 py-3 ${
                    item.isAvailable ? "" : "opacity-40"
                  }`}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas/10 text-xl"
                    aria-hidden
                  >
                    {item.emoji || "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-canvas">{item.name}</p>
                    <p className="text-xs text-canvas/40">
                      {item.categoryName} · {formatPrice(item.price)}
                    </p>
                  </div>
                  {item.isAvailable ? (
                    count === 0 ? (
                      <button
                        type="button"
                        onClick={() => setItemQty(item.id, 1)}
                        className="cursor-pointer rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-xl border border-canvas/15 bg-fog p-0.5">
                        <button
                          type="button"
                          onClick={() => setItemQty(item.id, count - 1)}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-lg leading-none text-canvas hover:bg-canvas/10"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold tabular-nums text-canvas">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemQty(item.id, count + 1)}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-accent text-lg leading-none text-ink"
                        >
                          +
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-canvas/35">Unavailable</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-canvas/10 bg-fog p-4 sm:p-5 lg:sticky lg:top-24">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
          Ticket
        </p>
        <h2 className="mt-1 text-base font-semibold text-canvas">
          Order summary
        </h2>
        <p className="mt-1 text-sm text-canvas/45">
          {selected?.name ?? "No station"} · {paymentMethod.toUpperCase()}
        </p>

        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-canvas/40">No items yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 rounded-xl border border-canvas/8 bg-ink/50 px-3 py-2.5 text-sm">
            {lines.map(({ item, quantity }) => (
              <li
                key={item.id}
                className="flex justify-between gap-3 text-canvas/70"
              >
                <span className="truncate">
                  {quantity}× {item.name}
                </span>
                <span className="tabular-nums text-canvas/55">
                  {formatPrice(item.price * quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-baseline justify-between border-t border-canvas/10 pt-3">
          <span className="text-sm text-canvas/45">Total</span>
          <span className="text-xl font-bold tabular-nums text-canvas">
            {formatPrice(total)}
          </span>
        </div>

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 text-sm font-medium text-accent" role="status">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full cursor-pointer rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Placing…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
