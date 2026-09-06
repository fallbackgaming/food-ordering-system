/**
 * Official PhonePe merchant QR (no amount) — same payload as the printed standee.
 * App buttons open each wallet’s QR scanner; missing apps go to Play Store or App Store.
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

export function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

export function isIOS() {
  return (
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)
  );
}

const APP_LAUNCH: Record<
  UpiAppId,
  {
    scheme: string;
    /** Path after scheme:// — must match a registered Scan & Pay route. */
    androidPath: string;
    ios: string;
    pkg: string;
    playStore: string;
    appStore: string;
  }
> = {
  phonepe: {
    scheme: "phonepe",
    androidPath: "scan",
    ios: "phonepe://scan",
    pkg: "com.phonepe.app",
    playStore: "https://play.google.com/store/apps/details?id=com.phonepe.app",
    appStore: "https://apps.apple.com/app/id1170055821",
  },
  gpay: {
    scheme: "tez",
    androidPath: "upi/qrcamera",
    ios: "gpay://upi/qrcamera",
    pkg: "com.google.android.apps.nbu.paisa.user",
    playStore:
      "https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user",
    appStore: "https://apps.apple.com/app/id1193357043",
  },
  paytm: {
    scheme: "paytmmp",
    androidPath: "cash_wallet?featuretype=scanner_only",
    ios: "paytmmp://cash_wallet?featuretype=scanner_only",
    pkg: "net.one97.paytm",
    playStore: "https://play.google.com/store/apps/details?id=net.one97.paytm",
    appStore: "https://apps.apple.com/app/id473941634",
  },
};

export function upiAppPlayStoreUrl(app: UpiAppId) {
  return APP_LAUNCH[app].playStore;
}

export function upiAppStoreUrl(app: UpiAppId) {
  const spec = APP_LAUNCH[app];
  return isIOS() ? spec.appStore : spec.playStore;
}

/** Chrome Android Intent URL: open that app’s scanner, or Play Store if missing. */
export function androidUpiIntentUrl(app: UpiAppId) {
  const spec = APP_LAUNCH[app];
  const play = encodeURIComponent(spec.playStore);
  return (
    `intent://${spec.androidPath}#Intent;scheme=${spec.scheme};` +
    `package=${spec.pkg};action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${play};end`
  );
}

export function upiAppLaunchHref(app: UpiAppId) {
  if (isAndroid()) return androidUpiIntentUrl(app);
  if (isIOS()) return APP_LAUNCH[app].ios;
  return upiAppStoreUrl(app);
}

/** If the custom-scheme navigation never leaves the page, open the store. */
function openSchemeThenStore(appUrl: string, marketplaceUrl: string) {
  let left = false;
  const markLeft = () => {
    left = true;
  };

  document.addEventListener("visibilitychange", markLeft, { once: true });
  window.addEventListener("pagehide", markLeft, { once: true });
  window.addEventListener("blur", markLeft, { once: true });

  window.setTimeout(() => {
    if (left || document.hidden) return;
    window.location.href = marketplaceUrl;
  }, 1200);

  window.location.href = appUrl;
}

/** Opens the UPI app’s QR scanner if installed; otherwise Play Store or App Store. */
export function openUpiAppIfInstalled(app: UpiAppId) {
  const spec = APP_LAUNCH[app];

  if (isAndroid()) {
    window.location.href = androidUpiIntentUrl(app);
    return;
  }

  if (isIOS()) {
    openSchemeThenStore(spec.ios, spec.appStore);
    return;
  }

  window.location.href = spec.playStore;
}
