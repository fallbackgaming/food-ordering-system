/**
 * Google Pay deep-link for same-phone UPI checkout.
 * Bare `upi://` is avoided (WhatsApp often steals it).
 */

export type UpiPayParams = {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  note?: string;
  /** Optional GPay account id from a scanned merchant/personal QR (`aid=…`) */
  aid?: string;
};

/** Public cafe UPI details (must match the name registered on the VPA). */
export function getCafeUpiConfig(): {
  vpa: string;
  payeeName: string;
  aid?: string;
} {
  const aid = process.env.NEXT_PUBLIC_UPI_AID?.trim();
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "ishankadamlol@okaxis",
    // Must match the name on the UPI account — wrong `pn` often breaks bank load in GPay
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Ishan Kadam",
    aid: aid || "uGICAgIDnvMfoEQ",
  };
}

export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

/** Manual query encoding — URLSearchParams uses `+` for spaces; GPay expects `%20`. */
function upiQuery(params: UpiPayParams): string {
  const parts: Array<[string, string]> = [
    ["pa", params.vpa.trim()],
    ["pn", params.payeeName.trim()],
    ["am", paiseToUpiAmount(params.amountPaise)],
    ["cu", "INR"],
  ];

  const note = params.note?.trim().replace(/[^\w\s.-]/g, " ").slice(0, 50);
  if (note) parts.push(["tn", note]);

  if (params.aid?.trim()) parts.push(["aid", params.aid.trim()]);

  return parts
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Google Pay pay URI.
 * - Android: intent URL pinned to the GPay package (avoids WhatsApp / wrong handlers)
 * - Other: tez:// scheme (legacy Tez → GPay)
 */
export function buildGpayPayUri(params: UpiPayParams): string {
  const q = upiQuery(params);

  if (typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
    return `intent://upi/pay?${q}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end`;
  }

  return `tez://upi/pay?${q}`;
}
