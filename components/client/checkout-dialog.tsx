"use client";

import { FoodLoader } from "@/components/ui/food-loader";
import { UpiAppIcons } from "@/components/client/upi-app-icons";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import { useEffect, useId, useState } from "react";

type CheckoutDialogProps = {
  open: boolean;
  lines: CartLine[];
  stationLabel: string;
  onClose: () => void;
  onPlaceOrder: (method: "cash", customerName: string) => Promise<void>;
};

export function CheckoutDialog({
  open,
  lines,
  stationLabel,
  onClose,
  onPlaceOrder,
}: CheckoutDialogProps) {
  const titleId = useId();
  const [step, setStep] = useState<"details" | "success">("details");
  const [customerName, setCustomerName] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const nameOk = customerName.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "success") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  if (!open) return null;

  async function placeOrder() {
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      await onPlaceOrder("cash", customerName.trim());
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close checkout"
        className="absolute inset-0 bg-ink/60 backdrop-blur-[3px]"
        onClick={() => {
          if (step !== "success") onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] border border-ink/10 bg-canvas text-ink shadow-2xl animate-in sm:rounded-[1.5rem]"
      >
        {placing ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/90 backdrop-blur-sm">
            <FoodLoader
              fullScreen={false}
              label="Sending your order to the kitchen…"
            />
          </div>
        ) : null}

        {step === "details" && (
          <>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                Checkout · {stationLabel}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Your details
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                {formatPrice(total)} · pay cash on delivery
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 pb-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">
                  Your name <span className="text-red-500">*</span>
                </span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="field-input"
                  autoComplete="name"
                  required
                />
              </label>

              <div className="rounded-2xl border border-ink/8 bg-panel px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">
                  Order summary
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {lines.map((line) => (
                    <li
                      key={line.menuItemId}
                      className="flex justify-between gap-3 text-ink/70"
                    >
                      <span className="truncate">
                        {line.quantity}× {line.name}
                      </span>
                      <span className="tabular-nums">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-ink/8 pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                <p className="font-semibold">Cash on delivery</p>
                <p className="mt-0.5 text-sm text-ink/55">
                  Pay when staff brings your order to {stationLabel}.
                </p>
              </div>

              <UpiAppIcons />
            </div>

            {error ? (
              <p
                className="px-4 pb-2 text-sm font-medium text-red-600"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 border-t border-ink/8 p-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-ink/12 py-3 text-sm font-medium transition hover:bg-panel"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!nameOk || placing}
                onClick={() => void placeOrder()}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {placing ? "Placing…" : "Place order"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="px-5 py-10 text-center">
            <div className="animate-check mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-ink">
              ✓
            </div>
            <h2
              id={titleId}
              className="mt-5 text-2xl font-bold tracking-tight"
            >
              Order placed
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
              Thanks,{" "}
              <span className="font-semibold text-ink">
                {customerName.trim()}
              </span>
              . We&apos;ll bring it to{" "}
              <span className="font-semibold text-ink">{stationLabel}</span>
              . Pay cash on delivery, or scan the payment QR on the station
              screen.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-canvas transition hover:bg-ink/90"
            >
              Back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
