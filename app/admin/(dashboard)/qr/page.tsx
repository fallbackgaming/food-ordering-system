import { QrManager } from "@/components/admin/qr-manager";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function resolveAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export default async function AdminQrPage() {
  const [stations, appOrigin] = await Promise.all([
    prisma.station.findMany({
      orderBy: [{ type: "asc" }, { number: "asc" }],
    }),
    resolveAppOrigin(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Stations
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          QR codes
        </h1>
        <p className="mt-1 max-w-xl text-sm text-canvas/50">
          Create a named station QR. Scanning it opens the customer menu for
          that PC or PlayStation.
        </p>
      </div>
      <QrManager
        appOrigin={appOrigin}
        initialStations={stations.map((s) => ({
          id: s.id,
          type: s.type,
          number: s.number,
          name: s.name,
          isActive: s.isActive,
          qrToken: s.qrToken,
        }))}
      />
    </div>
  );
}
