/**
 * UPI deep-link helpers for same-phone checkout.
 * QR codes can't be scanned by the phone displaying them — open the UPI app instead.
 */

export type UpiPayParams = {
  /** Payee VPA, e.g. merchant@okaxis */
  vpa: string;
  /** Payee display name */
  payeeName: string;
  /** Amount in paise */
  amountPaise: number;
  /** Payment note shown in the UPI app */
  note?: string;
};

/** Public cafe UPI details (safe to expose — same as a printed QR). */
export function getCafeUpiConfig(): { vpa: string; payeeName: string } {
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "ishankadamlol@okaxis",
    payeeName:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Fallback Gaming Cafe",
  };
}

/** Rupees string for UPI `am` (two decimal places). */
export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

/**
 * Standard UPI intent URI. On Android this opens the UPI app chooser
 * (GPay / PhonePe / Paytm / BHIM). On iOS support is limited — pair with copy fallbacks.
 */
export function buildUpiPayUri(params: UpiPayParams): string {
  const q = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: paiseToUpiAmount(params.amountPaise),
    cu: "INR",
  });
  if (params.note?.trim()) {
    q.set("tn", params.note.trim().slice(0, 80));
  }
  return `upi://pay?${q.toString()}`;
}
