/** Canonical public site used for QR codes (customer order links). */
export const PRODUCTION_APP_URL =
  "https://food-ordering-system-virid-omega.vercel.app";

/**
 * Public site origin for QR codes and absolute links.
 * Always prefers the production cafe URL so printed QRs stay stable.
 */
export function getAppOriginFromEnv(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  // Stable production host for QR stickers (ignore preview/deployment URLs)
  return PRODUCTION_APP_URL;
}

export async function resolveAppOrigin() {
  return getAppOriginFromEnv();
}
