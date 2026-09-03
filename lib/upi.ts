/**
 * Cafe UPI helpers.
 *
 * Decoded from public/payment_qr.jpg:
 *   upi://pay?pa=alpeshzanjare123-1@okaxis&pn=Alpesh%20Zanjare&aid=uGICAgIDVn9rnbg
 *
 * That is a GPay “receive money” QR (pa + pn + aid only). It is NOT a signed
 * NPCI merchant intent (those include mc / mode / orgid / sign). Axis often
 * rejects amount-filled deep links to this style of VPA with a fake “limit”
 * error, while GPay “Pay to UPI ID” (Send money) works.
 *
 * If Axis/Google Pay Business gave you a 4-digit MCC, set NEXT_PUBLIC_UPI_MCC
 * and we can try Google’s merchant intent format:
 * https://developers.google.com/pay/india/api/android/in-app-payments
 */

export type UpiPayParams = {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  transactionRef: string;
  note?: string;
  /** 4-digit merchant category code from bank / PSP onboarding */
  mcc?: string;
};

export function getCafeUpiConfig(): {
  vpa: string;
  payeeName: string;
  mcc?: string;
  /** True when a real MCC is configured — enables merchant intent attempt */
  hasMerchantMcc: boolean;
} {
  const mcc = process.env.NEXT_PUBLIC_UPI_MCC?.trim();
  const validMcc = mcc && /^\d{4}$/.test(mcc) ? mcc : undefined;
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "alpeshzanjare123-1@okaxis",
    payeeName:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Alpesh Zanjare",
    mcc: validMcc,
    hasMerchantMcc: Boolean(validMcc),
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

function merchantIntentQuery(params: UpiPayParams): string {
  const tr = params.transactionRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35);
  const parts: Array<[string, string]> = [
    ["pa", encodeParam(params.vpa.trim(), { keepAt: true })],
    ["pn", encodeParam(params.payeeName.trim())],
  ];

  if (params.mcc) parts.push(["mc", params.mcc]);
  if (tr) parts.push(["tr", tr]);

  const note = params.note?.trim().replace(/[^\w\s.-]/g, " ").trim().slice(0, 50);
  if (note) parts.push(["tn", encodeParam(note)]);

  parts.push(
    ["am", paiseToUpiAmount(params.amountPaise)],
    ["cu", "INR"]
  );

  return parts.map(([k, v]) => `${k}=${v}`).join("&");
}

/** Open the Google Pay app only (Send money path that already works). */
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

/**
 * Merchant-style amount intent (needs a real 4-digit MCC from your bank/PSP).
 * Without MCC this often fails on Axis with “bank limit exceeded”.
 */
export function openMerchantGpayIntent(params: UpiPayParams) {
  const q = merchantIntentQuery(params);
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
  amountRupees: string;
}): Promise<"ok" | "copy-failed"> {
  const copied = await copyText(opts.vpa);
  openGpayApp();
  return copied ? "ok" : "copy-failed";
}
