"use client";

import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import { useEffect, useState } from "react";

type CartSheetProps = {
  lines: CartLine[];
  onIncrement: (menuItemId: string) => void;
  onDecrement: (menuItemId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
};

function CartLines({
  lines,
  onIncrement,
  onDecrement,
}: {
  lines: CartLine[];
  onIncrement: (menuItemId: string) => void;
  onDecrement: (menuItemId: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {lines.map((line) => (
        <li
          key={line.menuItemId}
          className="flex items-center gap-3 rounded-xl px-2 py-2"
        >
          <span className="text-xl" aria-hidden>
            {line.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{line.name}</p>
            <p className="text-xs text-ink/50">
              {formatPrice(line.unitPrice)} each
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-ink/10 p-0.5">
            <button
              type="button"
              aria-label={`Remove one ${line.name}`}
              onClick={() => onDecrement(line.menuItemId)}
              className="flex size-7 items-center justify-center rounded-md text-base leading-none hover:bg-ink/5"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label={`Add one ${line.name}`}
              onClick={() => onIncrement(line.menuItemId)}
              className="flex size-7 items-center justify-center rounded-md bg-accent/20 text-base leading-none hover:bg-accent/30"
            >
              +
            </button>
          </div>
          <p className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
            {formatPrice(line.unitPrice * line.quantity)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CartSheet({
  lines,
  onIncrement,
  onDecrement,
  onClear,
  onCheckout,
}: CartSheetProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  useEffect(() => {
    if (itemCount === 0) {
      setMobileOpen(false);
      setDesktopOpen(false);
      return;
    }
    setDesktopOpen(true);
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {mobileOpen && (
            <div className="mb-2 animate-in overflow-hidden rounded-2xl border border-ink/10 bg-canvas shadow-[0_-8px_40px_rgba(17,17,17,0.12)]">
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                    Your cart
                  </p>
                  <p className="text-sm text-ink/60">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-sm font-medium text-ink/50 transition hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-[40vh] overflow-y-auto px-2 py-2">
                <CartLines
                  lines={lines}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl bg-ink p-2 pl-4 text-canvas shadow-lg shadow-ink/20">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="min-w-0 flex-1 text-left"
              aria-expanded={mobileOpen}
            >
              <p className="text-xs uppercase tracking-[0.14em] text-accent">
                {mobileOpen ? "Hide cart" : "View cart"}
              </p>
              <p className="truncate text-sm font-medium">
                {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                {formatPrice(total)}
              </p>
            </button>
            <button
              type="button"
              onClick={onCheckout}
              className="shrink-0 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-ink transition hover:brightness-95 active:scale-[0.98]"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-40 hidden lg:block">
        <button
          type="button"
          aria-label="Close cart"
          onClick={() => setDesktopOpen(false)}
          className={`pointer-events-auto absolute inset-0 bg-ink/25 transition-opacity duration-300 ${
            desktopOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          aria-label="Shopping cart"
          className={`pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink/10 bg-canvas shadow-[-12px_0_40px_rgba(17,17,17,0.12)] transition-transform duration-300 ease-out ${
            desktopOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ink/10 px-5 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
                Your cart
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </h2>
              <p className="mt-1 text-sm text-ink/55">{formatPrice(total)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg px-2 py-1 text-sm font-medium text-ink/50 transition hover:bg-ink/5 hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                aria-label="Close cart drawer"
                onClick={() => setDesktopOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg border border-ink/10 text-lg leading-none transition hover:bg-ink/5"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <CartLines
              lines={lines}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          </div>

          <div className="border-t border-ink/10 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink/55">Total</span>
              <span className="text-xl font-bold tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-ink transition hover:brightness-95 active:scale-[0.99]"
            >
              Checkout
            </button>
          </div>
        </aside>
      </div>

      {!desktopOpen && (
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
          className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-left text-canvas shadow-lg shadow-ink/20 transition hover:bg-ink/90 lg:flex"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-accent">
              Cart
            </span>
            <span className="block text-sm font-medium">
              {itemCount} · {formatPrice(total)}
            </span>
          </span>
          <span className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-ink">
            Open
          </span>
        </button>
      )}
    </>
  );
}
