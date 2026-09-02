"use client";

import { formatPrice } from "@/lib/format";
import type { AnalyticsPayload, AnalyticsRange } from "@/lib/analytics";
import { useRouter, useSearchParams } from "next/navigation";

const RANGES: Array<{ days: AnalyticsRange; label: string }> = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

type AnalyticsDashboardProps = {
  data: AnalyticsPayload;
};

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function changeLabel(current: number, previous: number) {
  const pct = pctChange(current, previous);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs prior period`;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxDailyRevenue = Math.max(
    1,
    ...data.daily.map((d) => d.revenuePaise)
  );
  const maxHour = Math.max(1, ...data.byHour.map((h) => h.orderCount));
  const maxStation = Math.max(1, ...data.byStation.map((s) => s.revenuePaise));
  const maxItemQty = Math.max(1, ...data.topItems.map((i) => i.quantity));

  function setRange(days: AnalyticsRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", String(days));
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <div className="space-y-6 text-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-canvas/45">
          Snapshot · {new Date(data.generatedAt).toLocaleString("en-IN")}
        </p>
        <div className="flex gap-1 rounded-xl border border-canvas/10 bg-fog p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRange(r.days)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                data.rangeDays === r.days
                  ? "bg-accent text-ink"
                  : "text-canvas/60 hover:text-canvas"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Revenue"
          value={formatPrice(data.summary.revenuePaise)}
          hint={changeLabel(
            data.summary.revenuePaise,
            data.previous.revenuePaise
          )}
        />
        <Kpi
          label="Orders"
          value={String(data.summary.orderCount)}
          hint={changeLabel(data.summary.orderCount, data.previous.orderCount)}
        />
        <Kpi
          label="Avg order"
          value={formatPrice(data.summary.avgOrderPaise)}
          hint={`${data.summary.cancelledCount} cancelled (${(
            data.summary.cancelRate * 100
          ).toFixed(0)}%)`}
        />
        <Kpi
          label="Catalog"
          value={`${data.summary.menuItems} items`}
          hint={`${data.summary.activeStations} active stations`}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
        <div className="border-b border-canvas/10 px-5 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            Trend
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Daily revenue
          </h2>
        </div>
        <div className="overflow-x-auto px-4 py-5">
          <div className="flex h-44 min-w-[520px] items-end gap-1.5">
            {data.daily.map((day) => {
              const h = (day.revenuePaise / maxDailyRevenue) * 100;
              return (
                <div
                  key={day.date}
                  className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${day.label}: ${formatPrice(day.revenuePaise)} · ${day.orderCount} orders`}
                >
                  <span className="invisible text-[9px] tabular-nums text-canvas/50 group-hover:visible">
                    {day.orderCount || ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-accent/80 transition group-hover:bg-accent"
                    style={{ height: `${Math.max(h, day.orderCount ? 4 : 1)}%` }}
                  />
                  <span className="truncate text-[9px] text-canvas/35">
                    {data.rangeDays > 30
                      ? day.label.split(" ")[0]
                      : day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top items" eyebrow="Bestsellers">
          {data.topItems.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {data.topItems.map((item) => (
                <li key={item.name}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 tabular-nums text-canvas/50">
                      {item.quantity} sold
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(item.quantity / maxItemQty) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-canvas/40">
                    {formatPrice(item.revenuePaise)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="By station" eyebrow="Seats">
          {data.byStation.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {data.byStation.map((s) => (
                <li key={s.stationName}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="font-medium">{s.stationName}</span>
                    <span className="tabular-nums text-canvas/50">
                      {s.orderCount} orders
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{
                        width: `${(s.revenuePaise / maxStation) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-canvas/40">
                    {formatPrice(s.revenuePaise)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Payment mix" eyebrow="Methods">
          {data.byPayment.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {data.byPayment.map((p) => (
                <li
                  key={p.method}
                  className="flex items-center justify-between rounded-xl border border-canvas/8 bg-ink/40 px-3 py-2.5 text-sm"
                >
                  <span className="font-semibold uppercase tracking-wide">
                    {p.method}
                  </span>
                  <span className="text-canvas/55">
                    {p.count} · {formatPrice(p.revenuePaise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Order status" eyebrow="Pipeline">
          {data.byStatus.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {data.byStatus
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <li
                    key={s.status}
                    className="flex items-center justify-between rounded-xl border border-canvas/8 bg-ink/40 px-3 py-2.5 text-sm"
                  >
                    <span>{STATUS_LABEL[s.status] ?? s.status}</span>
                    <span className="tabular-nums font-semibold">{s.count}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Busy hours" eyebrow="When customers order">
        <div className="flex h-28 items-end gap-0.5 sm:gap-1">
          {data.byHour.map((h) => (
            <div
              key={h.hour}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${h.hour}:00 — ${h.orderCount} orders`}
            >
              <div
                className="w-full rounded-t bg-accent/60"
                style={{
                  height: `${(h.orderCount / maxHour) * 100}%`,
                  minHeight: h.orderCount > 0 ? 4 : 1,
                }}
              />
              {h.hour % 3 === 0 ? (
                <span className="text-[9px] text-canvas/35">{h.hour}</span>
              ) : (
                <span className="text-[9px] text-transparent">·</span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-canvas/10 bg-fog px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-canvas/40">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-canvas/45">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
      <div className="border-b border-canvas/10 px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <p className="py-6 text-center text-sm text-canvas/40">
      No data in this range yet.
    </p>
  );
}
