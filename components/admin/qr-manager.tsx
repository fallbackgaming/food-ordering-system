"use client";

import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StationRow = {
  id: string;
  type: "pc" | "ps";
  number: number;
  name: string;
  isActive: boolean;
  qrToken: string;
};

type QrManagerProps = {
  initialStations: StationRow[];
  appOrigin: string;
};

function defaultName(type: "pc" | "ps", number: number) {
  if (!number || number < 1) return "";
  return `${type.toUpperCase()}-${number}`;
}

function orderPath(type: "pc" | "ps", number: number) {
  return `/order/${type}/${number}`;
}

export function QrManager({ initialStations, appOrigin }: QrManagerProps) {
  const router = useRouter();
  const [stations, setStations] = useState(initialStations);
  const [type, setType] = useState<"pc" | "ps">("pc");
  const [number, setNumber] = useState("1");
  const [name, setName] = useState(defaultName("pc", 1));
  const [nameTouched, setNameTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const parsedNumber = Number(number);

  useEffect(() => {
    if (!nameTouched) {
      setName(
        defaultName(type, Number.isInteger(parsedNumber) ? parsedNumber : 0)
      );
    }
  }, [type, parsedNumber, nameTouched]);

  useEffect(() => {
    setStations(initialStations);
  }, [initialStations]);

  useEffect(() => {
    let cancelled = false;

    async function buildPreviews() {
      const next: Record<string, string> = {};
      for (const station of stations) {
        const url = `${appOrigin}${orderPath(station.type, station.number)}`;
        next[station.id] = await QRCode.toDataURL(url, {
          width: 360,
          margin: 2,
          color: { dark: "#0a0a0a", light: "#ffffff" },
        });
      }
      if (!cancelled) setPreviews(next);
    }

    void buildPreviews();
    return () => {
      cancelled = true;
    };
  }, [stations, appOrigin]);

  const previewUrl = useMemo(() => {
    if (!Number.isInteger(parsedNumber) || parsedNumber < 1) return "";
    return `${appOrigin}${orderPath(type, parsedNumber)}`;
  }, [appOrigin, type, parsedNumber]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
      setError("Enter a valid station number (1 or higher).");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        number: parsedNumber,
        name: name.trim() || defaultName(type, parsedNumber),
      }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not create QR");
      return;
    }

    const data = (await res.json()) as { station: StationRow };
    setStations((prev) => {
      const without = prev.filter((s) => s.id !== data.station.id);
      return [...without, data.station].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.number - b.number;
      });
    });
    setSuccess(`QR ready for ${data.station.name}`);
    setNameTouched(false);
    router.refresh();
  }

  function downloadQr(station: StationRow) {
    const dataUrl = previews[station.id];
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${station.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.click();
  }

  function printQr(station: StationRow) {
    const dataUrl = previews[station.id];
    if (!dataUrl) return;
    const popup = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=480,height=640"
    );
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${station.name} QR</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff}
        .card{text-align:center;padding:28px 24px;border:1px solid rgba(255,255,255,0.12);border-radius:20px;background:#141414}
        .qr{background:#fff;border-radius:16px;padding:16px;display:inline-block}
        img{width:260px;height:260px;display:block}
        .eyebrow{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1ecad3;margin:18px 0 0}
        h1{font-size:28px;margin:8px 0;letter-spacing:-0.03em}
        p{margin:0;color:rgba(255,255,255,0.5);font-size:13px}
      </style></head><body>
      <div class="card">
        <div class="qr"><img src="${dataUrl}" alt="QR for ${station.name}" /></div>
        <p class="eyebrow">Fallback Gaming Cafe</p>
        <h1>${station.name}</h1>
        <p>Scan to order · ${orderPath(station.type, station.number)}</p>
      </div>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    popup.document.close();
  }

  async function removeStation(id: string) {
    const res = await fetch(`/api/admin/stations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not delete");
      return;
    }
    setStations((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6 text-canvas">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="h-fit overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
          <div className="border-b border-canvas/10 px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
              New station
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Create station QR
            </h2>
            <p className="mt-1 text-sm text-canvas/50">
              Defaults to PC-1 / PS-1. Scan opens that station&apos;s menu.
            </p>
          </div>

          <form onSubmit={onCreate} className="space-y-4 px-5 py-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-canvas/75">
                Station type
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["pc", "ps"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                      type === option
                        ? "border-accent bg-accent text-ink"
                        : "border-canvas/12 bg-ink text-canvas/70 hover:border-canvas/25 hover:text-canvas"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-canvas/75">
                Station number
              </span>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="field-input-dark"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-canvas/75">
                QR / station name
              </span>
              <input
                value={name}
                onChange={(e) => {
                  setNameTouched(true);
                  setName(e.target.value);
                }}
                className="field-input-dark"
                placeholder="PC-1"
                required
              />
              <span className="mt-1.5 block text-xs text-canvas/40">
                Shown on the customer menu as the delivery target.
              </span>
            </label>

            {previewUrl ? (
              <div className="rounded-xl border border-canvas/10 bg-ink px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-canvas/35">
                  Opens
                </p>
                <p className="mt-1 break-all text-xs text-canvas/65">
                  {previewUrl}
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm font-medium text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm font-medium text-accent" role="status">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={creating}
              className="w-full cursor-pointer rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Saving…" : "Save & generate QR"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-canvas/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
                Print & stick
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                Station QR codes
              </h2>
              <p className="mt-1 text-sm text-canvas/50">
                Download or print for each PC / PlayStation.
              </p>
            </div>
            <p className="text-xs tabular-nums text-canvas/40">
              {stations.length} station{stations.length === 1 ? "" : "s"}
            </p>
          </div>

          {stations.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-canvas/70">
                No stations yet
              </p>
              <p className="mt-1 text-sm text-canvas/40">
                Create one with the form to generate a QR.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {stations.map((station) => (
                <li
                  key={station.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-canvas/10 bg-ink"
                >
                  <div className="px-4 pt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                      {station.type.toUpperCase()} · #{station.number}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
                      {station.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-canvas/40">
                      {orderPath(station.type, station.number)}
                    </p>
                  </div>

                  <div className="mx-4 mt-4 flex justify-center rounded-2xl bg-canvas p-4">
                    {previews[station.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[station.id]}
                        alt={`QR code for ${station.name}`}
                        className="size-40"
                      />
                    ) : (
                      <div className="flex size-40 items-center justify-center text-xs text-ink/40">
                        Generating…
                      </div>
                    )}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => downloadQr(station)}
                      className="cursor-pointer rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-ink transition hover:brightness-95"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => printQr(station)}
                      className="cursor-pointer rounded-xl border border-canvas/15 px-3 py-2 text-xs font-semibold text-canvas/80 transition hover:border-canvas/30 hover:bg-canvas/5 hover:text-canvas"
                    >
                      Print
                    </button>
                    <a
                      href={orderPath(station.type, station.number)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-canvas/15 px-3 py-2 text-center text-xs font-semibold text-canvas/80 transition hover:border-canvas/30 hover:bg-canvas/5 hover:text-canvas"
                    >
                      Open menu
                    </a>
                    <button
                      type="button"
                      onClick={() => void removeStation(station.id)}
                      className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-canvas/40 transition hover:bg-canvas/5 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
