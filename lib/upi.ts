/**
 * Google Pay deep-link for same-phone UPI checkout.
 *
 * Manual “Pay to UPI ID” works; broken intents often fail with a misleading
 * Axis “bank limit” error. Keep the URI as close to a normal `upi://pay` as
 * possible: raw `@` in VPA, scheme=upi (not tez), no `aid`.
 */

export type UpiPayParams = {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  /** Unique per attempt (UPI `tr`) — alphanumeric only */
  transactionRef: string;
  note?: string;
};

/** Public cafe UPI details (safe to expose — same as a printed QR). */
export function getCafeUpiConfig(): { vpa: string; payeeName: string } {
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "alpeshzanjare123-1@okaxis",
    payeeName:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Alpesh Zanjare",
  };
}

export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

/** Encode for UPI query — never turn `@` in the VPA into `%40`. */
function encodeParam(value: string, opts?: { keepAt?: boolean }) {
  if (opts?.keepAt) {
    return value
      .split("@")
      .map((part) => encodeURIComponent(part))
      .join("@");
  }
  return encodeURIComponent(value);
}

function upiQuery(params: UpiPayParams): string {
  const tr = params.transactionRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35);
  const parts: Array<[string, string]> = [
    ["pa", encodeParam(params.vpa.trim(), { keepAt: true })],
    ["pn", encodeParam(params.payeeName.trim())],
    ["am", paiseToUpiAmount(params.amountPaise)],
    ["cu", "INR"],
  ];

  if (tr) parts.push(["tr", tr]);

  const note = params.note?.trim().replace(/[^\w\s.-]/g, " ").trim().slice(0, 50);
  if (note) parts.push(["tn", encodeParam(note)]);

  return parts.map(([k, v]) => `${k}=${v}`).join("&");
}

/** Standard UPI pay URI (same shape as a scanned QR / manual pay). */
export function buildUpiPayUri(params: UpiPayParams): string {
  return `upi://pay?${upiQuery(params)}`;
}

/**
 * Open Google Pay with a UPI pay request.
 * Prefer Android intent with scheme=upi + GPay package (matches manual pay path).
 */
export function buildGpayPayUri(params: UpiPayParams): string {
  const q = upiQuery(params);

  if (typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
    // Resolves to upi://pay?... inside GPay — not tez://upi/pay
    return (
      `intent://pay?${q}` +
      `#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
    );
  }

  // iOS / desktop fallback
  return `gpay://upi/pay?${q}`;
}

/** Navigate to GPay; falls back to plain upi:// if intent is blocked. */
export function openGpayPayment(params: UpiPayParams) {
  const primary = buildGpayPayUri(params);
  const fallback = buildUpiPayUri(params);

  try {
    window.location.href = primary;
  } catch {
    window.location.href = fallback;
  }

  // If GPay didn't take over (desktop / blocked intent), try plain UPI shortly after
  window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.location.href = fallback;
    }
  }, 1200);
}
