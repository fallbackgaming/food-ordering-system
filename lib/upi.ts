/**
 * PhonePe *merchant* QR (Q…@ybl) only accepts the official scan-to-pay QR.
 * Homemade upi://pay?am=… Intents look like P2P and the bank declines them
 * after PIN: "payment to this receiver was declined".
 */

export type UpiAppId = "phonepe" | "gpay" | "paytm";

export function getCafeUpiConfig(): { vpa: string; payeeName: string } {
  return {
    vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "Q048350660@ybl",
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Fallback",
  };
}

export function paiseToUpiAmount(paise: number): string {
  return (Math.max(0, paise) / 100).toFixed(2);
}

function isAndroid() {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/** Open the UPI app so the guest can scan — do not pass a pay Intent. */
export function openNamedUpiApp(app: UpiAppId) {
  if (isAndroid()) {
    if (app === "phonepe") {
      window.location.href =
        "intent://home#Intent;scheme=phonepe;package=com.phonepe.app;end";
      return;
    }
    if (app === "gpay") {
      window.location.href =
        "intent://pay#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end";
      return;
    }
    window.location.href =
      "intent://#Intent;scheme=paytmmp;package=net.one97.paytm;end";
    return;
  }

  if (app === "gpay") {
    window.location.href = "gpay://";
    return;
  }
  if (app === "paytm") {
    window.location.href = "paytmmp://";
    return;
  }
  window.location.href = "phonepe://";
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
