/**
 * Cafe UPI helpers — Google Pay deep link for same-phone checkout.
 *
 * Latest QR: pa=alpeshzanjare123-1@okhdfcbank (business banking name:
 * Fallback Gaming Cafe). Prefer amount-filled upi://pay intents; keep a
 * clipboard fallback if a bank rejects autofill.
 */

export type UpiPayParams = {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  transactionRef: string;
  note?: string;
  mcc?: string;
};

export function getCafeUpiConfig(): {
  vpa: string;
  payeeName: string;
  mcc?: string;
} {
  const mcc = process.env.NEXT_PUBLIC_UPI_MCC?.trim();
  const validMcc = mcc && /^\d{4}$/.test(mcc) ? mcc : undefined;
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "alpeshzanjare123-1@okhdfcbank",
    payeeName:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Fallback Gaming Cafe",
    mcc: validMcc,
  };
}

export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

function encodeParam(value: string, opts?: { keepAt?: boolean }) {
  if (opts?.keepAt) {
    return value
      .split("@")
      .map((part) => encodeURIComponent(part))
      .join("@");
  }
  return encodeURIComponent(value);
}

function payQuery(params: UpiPayParams): string {
  const amount = paiseToUpiAmount(params.amountPaise);
  const tr = params.transactionRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35);
  const parts: Array<[string, string]> = [
    ["pa", encodeParam(params.vpa.trim(), { keepAt: true })],
    ["pn", encodeParam(params.payeeName.trim())],
    ["am", amount],
    ["cu", "INR"],
  ];

  if (params.mcc) parts.push(["mc", params.mcc]);
  if (tr) parts.push(["tr", tr]);

  const note = params.note?.trim().replace(/[^\w\s.-]/g, " ").trim().slice(0, 50);
  if (note) parts.push(["tn", encodeParam(note)]);

  return parts.map(([k, v]) => `${k}=${v}`).join("&");
}

/** Open GPay with VPA + amount prefilled. */
export function openGpayWithAmount(params: UpiPayParams) {
  if (params.amountPaise <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const q = payQuery(params);
  const android =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  if (android) {
    window.location.href =
      `intent://pay?${q}` +
      `#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    return;
  }

  window.location.href = `gpay://upi/pay?${q}`;
}

export function openGpayApp() {
  const android =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  if (android) {
    window.location.href =
      "intent://pay#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end";
    return;
  }

  window.location.href = "gpay://";
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function startManualGpayFlow(opts: {
  vpa: string;
}): Promise<"ok" | "copy-failed"> {
  const copied = await copyText(opts.vpa);
  openGpayApp();
  return copied ? "ok" : "copy-failed";
}
