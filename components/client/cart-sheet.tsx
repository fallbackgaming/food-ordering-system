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
    <ul className="space-y-2">
      {lines.map((line) => (
        <li
          key={line.menuItemId}
          className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-panel px-3 py-2.5"
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-canvas to-[#ebebeb] text-xl shadow-inner"
            aria-hidden
          >
            {line.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{line.name}</p>
            <p className="text-xs text-ink/45">
              {formatPrice(line.unitPrice)} each
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-canvas p-0.5">
            <button
              type="button"
              aria-label={`Remove one ${line.name}`}
              onClick={() => onDecrement(line.menuItemId)}
              className="flex size-8 items-center justify-center rounded-lg text-base leading-none text-ink transition hover:bg-panel active:scale-95"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-ink">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label={`Add one ${line.name}`}
              onClick={() => onIncrement(line.menuItemId)}
              className="flex size-8 items-center justify-center rounded-lg bg-accent text-base leading-none text-ink transition hover:brightness-95 active:scale-95"
            >
              +
            </button>
          </div>
          <p className="w-[4.25rem] shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
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
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {mobileOpen && (
            <div className="mb-2 animate-in overflow-hidden rounded-[1.35rem] border border-ink/10 bg-canvas text-ink shadow-[0_-16px_50px_rgba(17,17,17,0.16)]">
              <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3.5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                    Your cart
                  </p>
                  <p className="text-sm text-ink/55">
                    {itemCount} item{itemCount === 1 ? "" : "s"} ready
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-lg px-2 py-1 text-sm font-medium text-ink/45 transition hover:bg-panel hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-[42vh] overflow-y-auto px-3 py-3">
                <CartLines
                  lines={lines}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              </div>
            </div>
          )}

          <div className="animate-cart-pulse flex items-center gap-2 rounded-[1.35rem] bg-ink p-2 pl-4 text-canvas">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="min-w-0 flex-1 text-left"
              aria-expanded={mobileOpen}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
                {mobileOpen ? "Hide cart" : "View cart"}
              </p>
              <p className="truncate text-sm font-semibold">
                {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                {formatPrice(total)}
              </p>
            </button>
            <button
              type="button"
              onClick={onCheckout}
              className="shrink-0 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-ink transition hover:brightness-95 active:scale-[0.98]"
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
          className={`pointer-events-auto absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            desktopOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          aria-label="Shopping cart"
          className={`pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink/10 bg-canvas text-ink shadow-[-20px_0_60px_rgba(17,17,17,0.14)] transition-transform duration-300 ease-out ${
            desktopOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ink/8 px-5 py-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                Your cart
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </h2>
              <p className="mt-1 text-sm text-ink/50">{formatPrice(total)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg px-2 py-1 text-sm font-medium text-ink/45 transition hover:bg-panel hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                aria-label="Close cart drawer"
                onClick={() => setDesktopOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl border border-ink/10 text-lg leading-none text-ink transition hover:bg-panel"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <CartLines
              lines={lines}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          </div>

          <div className="border-t border-ink/8 bg-panel p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink/50">Total</span>
              <span className="text-2xl font-bold tabular-nums text-ink">
                {formatPrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-ink transition hover:brightness-95 active:scale-[0.99]"
            >
              Continue to checkout
            </button>
          </div>
        </aside>
      </div>

      {!desktopOpen && (
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
          className="animate-cart-pulse fixed bottom-6 right-6 z-40 hidden items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-left text-canvas lg:flex"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-accent">
              Cart
            </span>
            <span className="block text-sm font-semibold">
              {itemCount} · {formatPrice(total)}
            </span>
          </span>
          <span className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-ink">
            Open
          </span>
        </button>
      )}
    </>
  );
}
