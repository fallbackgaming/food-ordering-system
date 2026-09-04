/**
 * Official PhonePe merchant QR payload, plus amount and a note (guest name).
 * pa=Q048350660@ybl&pn=PhonePeMerchant&mc=0000&mode=02&purpose=00
 *
 * App buttons must pass this query into PhonePe / GPay / Paytm — never bare
 * upi:// (WhatsApp) and never open the app with an empty pay Intent.
 */

export type UpiAppId = "phonepe" | "gpay" | "paytm";

export type UpiPayParams = {
  amountPaise: number;
  note: string;
};

export function getCafeUpiConfig() {
  const mcc = process.env.NEXT_PUBLIC_UPI_MCC?.trim();
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "Q048350660@ybl",
    payeeName:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "PhonePeMerchant",
    mcc: mcc && /^\d{4}$/.test(mcc) ? mcc : "0000",
    mode: process.env.NEXT_PUBLIC_UPI_MODE?.trim() || "02",
    purpose: process.env.NEXT_PUBLIC_UPI_PURPOSE?.trim() || "00",
  };
}

export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

function encodeParam(value: string, keepAt = false) {
  if (keepAt) {
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

  const cfg = getCafeUpiConfig();
  const amount = paiseToUpiAmount(params.amountPaise);
  const note = params.note
    .replace(/[^\w\s.-]/g, " ")
    .trim()
    .slice(0, 50);

  const parts: Array<[string, string]> = [
    ["pa", encodeParam(cfg.vpa.trim(), true)],
    ["pn", encodeParam(cfg.payeeName.trim())],
    ["mc", cfg.mcc],
    ["mode", cfg.mode],
    ["purpose", cfg.purpose],
    ["am", amount],
    ["cu", "INR"],
  ];
  if (note) parts.push(["tn", encodeParam(note)]);

  return `upi://pay?${parts.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function payQuery(upiPayUri: string) {
  return upiPayUri.replace(/^upi:\/\/pay\?/, "");
}

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

export function openNamedUpiApp(app: UpiAppId, upiPayUri: string) {
  const q = payQuery(upiPayUri);

  if (isAndroid()) {
    const pkg =
      app === "phonepe"
        ? "com.phonepe.app"
        : app === "gpay"
          ? "com.google.android.apps.nbu.paisa.user"
          : "net.one97.paytm";
    window.location.href =
      `intent://pay?${q}#Intent;scheme=upi;package=${pkg};end`;
    return;
  }

  if (app === "gpay") {
    window.location.href = `gpay://upi/pay?${q}`;
    return;
  }
  if (app === "paytm") {
    window.location.href = `paytmmp://pay?${q}`;
    return;
  }
  window.location.href = `phonepe://pay?${q}`;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
