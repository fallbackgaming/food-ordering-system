"use client";

import { FoodLoader } from "@/components/ui/food-loader";
import { formatPrice } from "@/lib/format";
import type { CartLine, PaymentMethod } from "@/lib/types";
import {
  buildUpiPayUri,
  copyText as copyToClipboard,
  getCafeUpiConfig,
  openUpiApp,
  paiseToUpiAmount,
} from "@/lib/upi";
import QRCode from "qrcode";
import { useEffect, useId, useMemo, useState } from "react";

type CheckoutStep = "details" | "upi" | "success";
type CheckoutMethod = Extract<PaymentMethod, "cash" | "upi">;

type CheckoutDialogProps = {
  open: boolean;
  lines: CartLine[];
  stationLabel: string;
  onClose: () => void;
  onPlaceOrder: (
    method: CheckoutMethod,
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
  const [step, setStep] = useState<CheckoutStep>("details");
  const [method, setMethod] = useState<CheckoutMethod | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [placedMethod, setPlacedMethod] = useState<CheckoutMethod | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"vpa" | "amount" | null>(null);
  const [upiUri, setUpiUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const nameOk = customerName.trim().length > 0;
  const upi = useMemo(() => getCafeUpiConfig(), []);
  const upiAmount = paiseToUpiAmount(total);

  useEffect(() => {
    if (!upiUri) return;
    let cancelled = false;
    void QRCode.toDataURL(upiUri, {
      width: 360,
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [upiUri]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "success") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  if (!open) return null;

  async function copyValue(value: string, kind: "vpa" | "amount") {
    const ok = await copyToClipboard(value);
    if (!ok) {
      setError("Could not copy — long-press the value instead.");
      return;
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  async function placeOrder(selected: CheckoutMethod) {
    if (!customerName.trim()) {
      setError("Please enter your name");
      setStep("details");
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

  function continueFromDetails() {
    if (!method) {
      setError("Choose cash or UPI");
      return;
    }
    if (!nameOk) {
      setError("Please enter your name");
      return;
    }
    setError(null);
    if (method === "cash") {
      void placeOrder("cash");
      return;
    }
    if (total <= 0) {
      setError("Cart total is zero — add items before paying.");
      return;
    }
    try {
      const uri = buildUpiPayUri({
        vpa: upi.vpa,
        payeeName: upi.payeeName,
        amountPaise: total,
        transactionRef: `FB${stationLabel}${total}${customerName}`
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 35),
        note: `FB ${stationLabel} ${customerName.trim() || "order"}`,
        mcc: upi.mcc,
        mode: upi.mode,
        purpose: upi.purpose,
      });
      setUpiUri(uri);
      setQrDataUrl(null);
      setStep("upi");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start UPI payment"
      );
    }
  }

  function payInUpiApp() {
    if (!upiUri) {
      setError("Could not build UPI payment.");
      return;
    }
    setError(null);
    openUpiApp(upiUri);
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

              <div>
                <p className="mb-1.5 text-sm font-medium">Pay with</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("cash")}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      method === "cash"
                        ? "border-accent bg-accent/15"
                        : "border-ink/10 bg-panel hover:border-ink/20"
                    }`}
                  >
                    <p className="font-semibold">Cash</p>
                    <p className="mt-0.5 text-xs text-ink/50">On delivery</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      method === "upi"
                        ? "border-accent bg-accent/15"
                        : "border-ink/10 bg-panel hover:border-ink/20"
                    }`}
                  >
                    <p className="font-semibold">UPI</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      Amount pre-filled
                    </p>
                  </button>
                </div>
              </div>

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
                disabled={!nameOk || !method || placing}
                onClick={() => continueFromDetails()}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {method === "upi"
                  ? "Continue to pay"
                  : placing
                    ? "Placing…"
                    : "Place order"}
              </button>
            </div>
          </>
        )}

        {step === "upi" && (
          <>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                UPI · {stationLabel}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Pay {formatPrice(total)}
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Scan this QR in any UPI app. Amount is already filled — do not
                use the printed counter QR.
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 pb-2">
              <div className="flex justify-center rounded-2xl border border-ink/8 bg-white p-4">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="UPI payment QR with amount filled"
                    className="size-52"
                  />
                ) : (
                  <div className="flex size-52 items-center justify-center text-sm text-ink/40">
                    Preparing QR…
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={payInUpiApp}
                className="w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90"
              >
                Open UPI app
              </button>

              <div className="rounded-2xl border border-ink/8 bg-panel px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">
                      UPI ID
                    </p>
                    <p className="truncate font-medium">{upi.vpa}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyValue(upi.vpa, "vpa")}
                    className="shrink-0 rounded-xl border border-ink/12 px-3 py-1.5 text-xs font-medium hover:bg-canvas"
                  >
                    {copied === "vpa" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/8 pt-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">
                      Amount
                    </p>
                    <p className="font-semibold tabular-nums">₹{upiAmount}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyValue(upiAmount, "amount")}
                    className="shrink-0 rounded-xl border border-ink/12 px-3 py-1.5 text-xs font-medium hover:bg-canvas"
                  >
                    {copied === "amount" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-ink/45">
                PhonePe, GPay, Paytm, BHIM — any UPI app. Staff will confirm
                the payment before preparing the order.
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
                onClick={() => {
                  setError(null);
                  setStep("details");
                }}
                className="flex-1 rounded-2xl border border-ink/12 py-3 text-sm font-medium transition hover:bg-panel"
              >
                Back
              </button>
              <button
                type="button"
                disabled={placing}
                onClick={() => void placeOrder("upi")}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                I&apos;ve paid
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
              {placedMethod === "upi"
                ? ". Staff will confirm your UPI payment."
                : ". Pay cash on delivery."}
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
