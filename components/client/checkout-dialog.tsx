"use client";

import { formatPrice } from "@/lib/format";
import type { CartLine, PaymentMethod } from "@/lib/types";
import {
  buildGpayPayUri,
  getCafeUpiConfig,
  paiseToUpiAmount,
} from "@/lib/upi";
import { FoodLoader } from "@/components/ui/food-loader";
import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";

type CheckoutStep = "method" | "upi" | "success";

type CheckoutDialogProps = {
  open: boolean;
  lines: CartLine[];
  stationLabel: string;
  onClose: () => void;
  onPlaceOrder: (
    method: Extract<PaymentMethod, "cash" | "upi">,
    customerName: string
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
  const [customerName, setCustomerName] = useState("");
  const [placedMethod, setPlacedMethod] = useState<"cash" | "upi" | null>(
    null
  );
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"vpa" | "amount" | null>(null);
  const [showQr, setShowQr] = useState(false);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const nameOk = customerName.trim().length > 0;
  const upi = useMemo(() => getCafeUpiConfig(), []);
  const upiAmount = paiseToUpiAmount(total);
  const gpayUri = useMemo(
    () =>
      buildGpayPayUri({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amountPaise: total,
        aid: upi.aid,
        // Keep note short / plain — fancy text can stall GPay bank load
        note: `FB ${stationLabel} ${customerName.trim() || "order"}`
          .replace(/[^\w\s.-]/g, " ")
          .slice(0, 40),
      }),
    [upi.vpa, upi.payeeName, upi.aid, total, stationLabel, customerName]
  );

  useEffect(() => {
    if (!open) return;
    setStep("method");
    setMethod(null);
    setCustomerName("");
    setPlacedMethod(null);
    setPlacing(false);
    setError(null);
    setCopied(null);
    setShowQr(false);
  }, [open]);

  async function copyText(value: string, kind: "vpa" | "amount") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy — long-press the value instead.");
    }
  }

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
    if (!customerName.trim()) {
      setError("Please enter your name");
      setStep("method");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      await onPlaceOrder(selected, customerName.trim());
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
    if (!nameOk) {
      setError("Please enter your name");
      return;
    }
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

        {step !== "success" ? (
          <div className="flex items-center gap-2 border-b border-ink/8 px-5 py-3">
            <StepDot active={step === "method"} label="1" />
            <div className="h-px flex-1 bg-ink/10" />
            <StepDot active={step === "upi" || method === "upi"} label="2" />
          </div>
        ) : null}

        {step === "method" && (
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
                {formatPrice(total)}
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
              </div>

              <p className="pt-1 text-sm font-medium text-ink/70">
                How will you pay?
              </p>
              <PaymentOption
                selected={method === "cash"}
                title="Cash on delivery"
                description="Pay when staff arrives at your station"
                onSelect={() => setMethod("cash")}
              />
              <PaymentOption
                selected={method === "upi"}
                title="UPI"
                description="Pay with Google Pay"
                onSelect={() => setMethod("upi")}
              />
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
                disabled={!method || !nameOk || placing}
                onClick={continueFromMethod}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                UPI payment · {customerName.trim()}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Pay {formatPrice(total)}
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                You&apos;re already on your phone — open a UPI app instead of
                scanning a QR.
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto px-5 pb-2">
              <a
                href={gpayUri}
                className="flex w-full items-center justify-center rounded-2xl bg-accent py-3.5 text-sm font-semibold text-ink transition hover:brightness-95"
              >
                Pay {formatPrice(total)} with Google Pay
              </a>
              <p className="text-center text-xs text-ink/45">
                Opens Google Pay with amount filled in.
              </p>

              <div className="rounded-2xl border border-ink/10 bg-panel px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">
                  Or pay manually
                </p>
                <div className="mt-2 space-y-2">
                  <CopyRow
                    label="UPI ID"
                    value={upi.vpa}
                    copied={copied === "vpa"}
                    onCopy={() => void copyText(upi.vpa, "vpa")}
                  />
                  <CopyRow
                    label="Amount"
                    value={`₹${upiAmount}`}
                    copyValue={upiAmount}
                    copied={copied === "amount"}
                    onCopy={() => void copyText(upiAmount, "amount")}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink/45">
                  If Google Pay opens but banks don&apos;t load, use Copy and
                  paste into GPay → Pay to a UPI ID.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                className="w-full text-center text-xs font-medium text-ink/45 underline-offset-2 hover:text-ink/70 hover:underline"
              >
                {showQr
                  ? "Hide QR code"
                  : "Show QR (only if someone else can scan it)"}
              </button>

              {showQr ? (
                <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                  <Image
                    src="/payment_qr.png"
                    alt="UPI payment QR code"
                    width={720}
                    height={900}
                    className="h-auto w-full"
                  />
                </div>
              ) : null}

              <p className="text-center text-sm text-ink/55">
                After paying, confirm below to place your order.
              </p>
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
                onClick={() => setStep("method")}
                disabled={placing}
                className="flex-1 rounded-2xl border border-ink/12 py-3 text-sm font-medium transition hover:bg-panel"
              >
                Back
              </button>
              <button
                type="button"
                disabled={placing}
                onClick={() => void placeOrder("upi")}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-40"
              >
                {placing ? "Placing…" : "I've paid · Place order"}
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
              {placedMethod === "cash"
                ? ". Pay cash on delivery."
                : ". Thanks for paying via UPI."}
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

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
        active ? "bg-accent text-ink" : "bg-panel text-ink/40"
      }`}
    >
      {label}
    </span>
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
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? "border-accent bg-accent/10 ring-1 ring-accent"
          : "border-ink/10 hover:border-ink/20 hover:bg-panel/80"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-ink/55">{description}</p>
        </div>
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
            selected
              ? "border-accent bg-accent text-ink"
              : "border-ink/20 text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
      </div>
    </button>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copyValue?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink/8 bg-canvas px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink/40">
          {label}
        </p>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition hover:bg-ink/90"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only">{copyValue ?? value}</span>
    </div>
  );
}
