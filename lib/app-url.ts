/**
 * Public site origin used for QR codes and absolute links.
 * Prefer NEXT_PUBLIC_APP_URL; on Vercel, VERCEL_URL is set automatically.
 */
export function getAppOriginFromEnv(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return host.replace(/\/$/, "");
  }

  return null;
}

export async function resolveAppOrigin(fallback = "http://localhost:3000") {
  const fromEnv = getAppOriginFromEnv();
  if (fromEnv) return fromEnv;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() unavailable outside a request
  }

  return fallback;
}
