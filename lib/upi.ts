/**
 * Same PhonePe merchant VPA as the printed QR, with amount filled in.
 * Static standee QR has no `am=` — we build a fresh UPI Intent for each cart.
 */

export type UpiPayParams = {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  transactionRef: string;
  note?: string;
  mcc?: string;
  mode?: string;
  purpose?: string;
};

export function getCafeUpiConfig(): {
  vpa: string;
  payeeName: string;
  mcc?: string;
  mode?: string;
  purpose?: string;
} {
  const mcc = process.env.NEXT_PUBLIC_UPI_MCC?.trim();
  const validMcc = mcc && /^\d{4}$/.test(mcc) ? mcc : "0000";
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "Q048350660@ybl",
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Fallback",
    mcc: validMcc,
    mode: process.env.NEXT_PUBLIC_UPI_MODE?.trim() || "02",
    purpose: process.env.NEXT_PUBLIC_UPI_PURPOSE?.trim() || "00",
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

export function buildUpiPayUri(params: UpiPayParams): string {
  if (params.amountPaise <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const amount = paiseToUpiAmount(params.amountPaise);
  const tr = params.transactionRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35);
  const parts: Array<[string, string]> = [
    ["pa", encodeParam(params.vpa.trim(), { keepAt: true })],
    ["pn", encodeParam(params.payeeName.trim())],
  ];

  if (params.mcc) parts.push(["mc", params.mcc]);
  if (params.mode) parts.push(["mode", params.mode]);
  if (params.purpose) parts.push(["purpose", params.purpose]);
  if (tr) parts.push(["tr", tr]);

  const note = params.note
    ?.trim()
    .replace(/[^\w\s.-]/g, " ")
    .trim()
    .slice(0, 50);
  if (note) parts.push(["tn", encodeParam(note)]);

  parts.push(["am", amount], ["cu", "INR"]);

  return `upi://pay?${parts.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

export function openUpiApp(uri: string) {
  const android =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const query = uri.replace(/^upi:\/\/pay\?/, "");

  if (android) {
    // No package= so the OS shows every UPI app, not only GPay / PhonePe.
    window.location.href = `intent://pay?${query}#Intent;scheme=upi;end`;
    return;
  }

  window.location.href = uri;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
