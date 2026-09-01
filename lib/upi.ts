/**
 * UPI deep-link helpers for same-phone checkout.
 * Avoid bare `upi://` — WhatsApp Pay often steals that intent. Prefer app-specific schemes.
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

export type UpiAppLink = {
  id: "gpay" | "phonepe" | "paytm";
  label: string;
  href: string;
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

function upiQuery(params: UpiPayParams): string {
  const q = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: paiseToUpiAmount(params.amountPaise),
    cu: "INR",
  });
  if (params.note?.trim()) {
    q.set("tn", params.note.trim().slice(0, 80));
  }
  return q.toString();
}

/**
 * App-specific pay links. Generic `upi://` is intentionally omitted — on many
 * phones WhatsApp claims that scheme and opens instead of GPay.
 */
export function buildUpiAppLinks(params: UpiPayParams): UpiAppLink[] {
  const q = upiQuery(params);

  return [
    {
      id: "gpay",
      label: "Google Pay",
      // tez:// is the reliable GPay (ex-Tez) scheme; gpay:// is a secondary alias
      href: `tez://upi/pay?${q}`,
    },
    {
      id: "phonepe",
      label: "PhonePe",
      href: `phonepe://pay?${q}`,
    },
    {
      id: "paytm",
      label: "Paytm",
      href: `paytmmp://pay?${q}`,
    },
  ];
}
