/**
 * Official PhonePe merchant QR (no amount) — same payload as the printed standee.
 * App launchers open PhonePe / GPay / Paytm only; they do not start a pay Intent.
 */

export type UpiAppId = "phonepe" | "gpay" | "paytm";

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

function encodeParam(value: string, keepAt = false) {
  if (keepAt) {
    return value
      .split("@")
      .map((part) => encodeURIComponent(part))
      .join("@");
  }
  return encodeURIComponent(value);
}

/** Static merchant pay URI for wallpaper / standee (no am=). */
export function officialMerchantPayUri(): string {
  const cfg = getCafeUpiConfig();
  const parts: Array<[string, string]> = [
    ["pa", encodeParam(cfg.vpa.trim(), true)],
    ["pn", encodeParam(cfg.payeeName.trim())],
    ["mc", cfg.mcc],
    ["mode", cfg.mode],
    ["purpose", cfg.purpose],
  ];
  return `upi://pay?${parts.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

const APP_LAUNCH: Record<
  UpiAppId,
  { scheme: string; ios: string; pkg: string }
> = {
  phonepe: {
    scheme: "phonepe",
    ios: "phonepe://",
    pkg: "com.phonepe.app",
  },
  gpay: {
    scheme: "tez",
    ios: "gpay://",
    pkg: "com.google.android.apps.nbu.paisa.user",
  },
  paytm: {
    scheme: "paytmmp",
    ios: "paytmmp://",
    pkg: "net.one97.paytm",
  },
};

/** Opens the UPI app if installed. Missing apps stay on this page (no Play Store). */
export function openUpiAppIfInstalled(app: UpiAppId) {
  const spec = APP_LAUNCH[app];
  if (isAndroid()) {
    const fallback = encodeURIComponent(window.location.href);
    window.location.href =
      `intent://launch#Intent;scheme=${spec.scheme};package=${spec.pkg};` +
      `S.browser_fallback_url=${fallback};end`;
    return;
  }
  window.location.href = spec.ios;
}
