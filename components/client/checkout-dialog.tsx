"use client";

import { formatPrice } from "@/lib/format";
import type { CartLine, PaymentMethod } from "@/lib/types";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

type CheckoutStep = "method" | "upi" | "success";

type CheckoutDialogProps = {
  open: boolean;
  lines: CartLine[];
  stationLabel: string;
  onClose: () => void;
  onPlaceOrder: (
    method: Extract<PaymentMethod, "cash" | "upi">
  ) => Promise<void>;
};

export function CheckoutDialog({
  open,
  lines,
  stationLabel,
  onClose,
  onPlaceOrder,
}: CheckoutDialogProps) {
  const titleId = useId();
  const [step, setStep] = useState<CheckoutStep>("method");
  const [method, setMethod] = useState<"cash" | "upi" | null>(null);
  const [placedMethod, setPlacedMethod] = useState<"cash" | "upi" | null>(
    null
  );
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  useEffect(() => {
    if (!open) return;
    setStep("method");
    setMethod(null);
    setPlacedMethod(null);
    setPlacing(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "success") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  if (!open) return null;

  async function placeOrder(selected: "cash" | "upi") {
    setPlacing(true);
    setError(null);
    try {
      await onPlaceOrder(selected);
      setPlacedMethod(selected);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  function continueFromMethod() {
    if (!method) return;
    if (method === "cash") {
      void placeOrder("cash");
      return;
    }
    setStep("upi");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close checkout"
        className="absolute inset-0 bg-ink/45"
        onClick={() => {
          if (step !== "success") onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ink/10 bg-canvas shadow-2xl animate-in sm:rounded-2xl"
      >
        {step === "method" && (
          <>
            <div className="border-b border-ink/10 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                Checkout · {stationLabel}
              </p>
              <h2 id={titleId} className="mt-1 text-xl font-bold tracking-tight">
                How will you pay?
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                {itemCount} item{itemCount === 1 ? "" : "s"} · {formatPrice(total)}
              </p>
            </div>

            <div className="space-y-2 overflow-y-auto px-4 py-4">
              <PaymentOption
                selected={method === "cash"}
                title="Cash"
                description="Pay when staff delivers to your station"
                onSelect={() => setMethod("cash")}
              />
              <PaymentOption
                selected={method === "upi"}
                title="UPI"
                description="Scan QR and pay with any UPI app"
                onSelect={() => setMethod("upi")}
              />
            </div>

            {error ? (
              <p className="px-4 pb-2 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 border-t border-ink/10 p-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-ink/15 py-3 text-sm font-medium transition hover:bg-ink/5"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!method || placing}
                onClick={continueFromMethod}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {placing
                  ? "Placing…"
                  : method === "cash"
                    ? "Place order"
                    : "Continue"}
              </button>
            </div>
          </>
        )}

        {step === "upi" && (
          <>
            <div className="border-b border-ink/10 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                UPI payment
              </p>
              <h2 id={titleId} className="mt-1 text-xl font-bold tracking-tight">
                Scan to pay {formatPrice(total)}
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Delivering to {stationLabel}
              </p>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
                <Image
                  src="/payment_qr.png"
                  alt="UPI payment QR code for Ishan Kadam"
                  width={720}
                  height={900}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-sm text-ink/60">
                After paying, confirm below to place your order.
              </p>
            </div>

            {error ? (
              <p className="px-4 pb-2 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 border-t border-ink/10 p-4">
              <button
                type="button"
                onClick={() => setStep("method")}
                disabled={placing}
                className="flex-1 rounded-xl border border-ink/15 py-3 text-sm font-medium transition hover:bg-ink/5"
              >
                Back
              </button>
              <button
                type="button"
                disabled={placing}
                onClick={() => void placeOrder("upi")}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-40"
              >
                {placing ? "Placing…" : "I've paid · Place order"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/25 text-2xl font-bold text-ink">
              ✓
            </div>
            <h2 id={titleId} className="mt-4 text-2xl font-bold tracking-tight">
              Order placed
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              We&apos;ll bring it to{" "}
              <span className="font-semibold text-ink">{stationLabel}</span>
              {placedMethod === "cash"
                ? ". Pay cash on delivery."
                : ". Thanks for paying via UPI."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90"
            >
              Back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentOption({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-4 py-3.5 text-left transition ${
        selected
          ? "border-accent bg-accent/10 ring-1 ring-accent"
          : "border-ink/10 hover:border-ink/25"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-ink/55">{description}</p>
        </div>
        <span
          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-accent bg-accent text-[10px] font-bold text-ink"
              : "border-ink/25"
          }`}
          aria-hidden
        >
          {selected ? "✓" : ""}
        </span>
      </div>
    </button>
  );
}
