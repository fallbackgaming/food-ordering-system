"use client";

import { formatPrice } from "@/lib/format";
import { FoodLoader } from "@/components/ui/food-loader";
import { useCallback, useEffect, useRef, useState } from "react";

export type AdminOrder = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string | null;
  totalAmount: number;
  customerName: string;
  customerNote: string | null;
  createdAt: string;
  station: { name: string; type: string; number: number };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type OrdersStats = {
  activeCount: number;
  completedCount: number;
  revenueToday: number;
};

type OrdersView = "active" | "completed";

const STATUS_FLOW = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "DELIVERED",
] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-400/15 text-amber-300",
  PAID: "bg-sky-400/15 text-sky-300",
  PREPARING: "bg-accent/20 text-accent",
  READY: "bg-emerald-400/15 text-emerald-300",
  DELIVERED: "bg-canvas/10 text-canvas/50",
  CANCELLED: "bg-red-400/15 text-red-300",
};

function nextStatuses(current: string): string[] {
  if (current === "CANCELLED" || current === "DELIVERED") return [];
  const idx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
  const next =
    idx >= 0 && idx < STATUS_FLOW.length - 1 ? [STATUS_FLOW[idx + 1]!] : [];
  return [...next, "CANCELLED"];
}

function isActiveStatus(status: string) {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

type OrdersBoardProps = {
  initialOrders: AdminOrder[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialStats: OrdersStats;
};

type OrdersPageResponse = {
  orders: AdminOrder[];
  nextCursor: string | null;
  hasMore: boolean;
  stats: OrdersStats;
};

export function OrdersBoard({
  initialOrders,
  initialCursor,
  initialHasMore,
  initialStats,
}: OrdersBoardProps) {
  const [view, setView] = useState<OrdersView>("active");
  const [orders, setOrders] = useState(initialOrders);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [stats, setStats] = useState(initialStats);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingLock = useRef(false);

  useEffect(() => {
    if (view !== "active") return;
    setOrders(initialOrders);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
    setStats(initialStats);
  }, [initialOrders, initialCursor, initialHasMore, initialStats, view]);

  const fetchPage = useCallback(
    async (opts: {
      scope: OrdersView;
      cursor?: string | null;
      replace?: boolean;
    }) => {
      const params = new URLSearchParams({
        limit: "15",
        scope: opts.scope,
      });
      if (opts.cursor) params.set("cursor", opts.cursor);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load orders");
      return (await res.json()) as OrdersPageResponse;
    },
    []
  );

  const switchView = useCallback(
    async (next: OrdersView) => {
      if (next === view && !loadingView) return;
      setView(next);
      setLoadingView(true);
      setError(null);
      loadingLock.current = false;
      try {
        const data = await fetchPage({ scope: next, replace: true });
        setOrders(data.orders);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoadingView(false);
      }
    },
    [fetchPage, loadingView, view]
  );

  const refreshLatest = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchPage({ scope: view });
      setOrders(data.orders);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, view]);

  useEffect(() => {
    if (view !== "active") return;
    const id = window.setInterval(() => {
      void refreshLatest();
    }, 10000);
    return () => window.clearInterval(id);
  }, [refreshLatest, view]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingLock.current || loadingView) return;
    loadingLock.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchPage({ scope: view, cursor });
      setOrders((prev) => {
        const map = new Map<string, AdminOrder>();
        for (const order of [...prev, ...data.orders]) map.set(order.id, order);
        return Array.from(map.values()).sort((a, b) => {
          const time = +new Date(b.createdAt) - +new Date(a.createdAt);
          if (time !== 0) return time;
          return b.id.localeCompare(a.id);
        });
      });
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoadingMore(false);
      loadingLock.current = false;
    }
  }, [cursor, fetchPage, hasMore, loadingView, view]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loadingView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingView]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) return;

    const data = (await res.json()) as { order: AdminOrder };
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, status: data.order.status } : o
      );
      if (view === "active") {
        return next.filter((o) => isActiveStatus(o.status));
      }
      if (view === "completed") {
        return next.filter((o) => !isActiveStatus(o.status));
      }
      return next;
    });
    void refreshLatest();
  }

  const title = view === "active" ? "Live orders" : "Completed orders";
  const emptyLabel =
    view === "active" ? "No active orders yet." : "No completed orders yet.";

  return (
    <div className="min-w-0 space-y-6 text-canvas">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Active orders"
          value={String(stats.activeCount)}
          active={view === "active"}
          onClick={() => void switchView("active")}
        />
        <Stat
          label="Completed"
          value={String(stats.completedCount)}
          active={view === "completed"}
          onClick={() => void switchView("completed")}
        />
        <Stat label="Revenue today" value={formatPrice(stats.revenueToday)} />
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-canvas/10 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-canvas/45">
              Showing {orders.length} · loads 15 at a time
              {view === "active" && refreshing ? " · refreshing…" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshLatest()}
            disabled={refreshing || loadingView}
            className="shrink-0 cursor-pointer rounded-xl border border-canvas/15 px-3 py-1.5 text-sm font-medium text-canvas/80 transition hover:border-canvas/30 hover:bg-canvas/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loadingView ? (
          <FoodLoader
            fullScreen={false}
            tone="dark"
            label={
              view === "completed"
                ? "Loading completed orders…"
                : "Loading live orders…"
            }
          />
        ) : orders.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-canvas/45">
            {emptyLabel}
          </p>
        ) : (
          <ul className="divide-y divide-canvas/8">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                busy={updatingId === order.id}
                onStatus={(status) => void updateStatus(order.id, status)}
              />
            ))}
          </ul>
        )}

        <div ref={sentinelRef} className="px-4 py-4 sm:px-5">
          {loadingMore ? (
            <FoodLoader
              fullScreen={false}
              tone="dark"
              label="Loading older orders…"
            />
          ) : null}
          {!loadingView && !hasMore && orders.length > 0 ? (
            <p className="text-center text-xs text-canvas/35">
              You&apos;re all caught up
            </p>
          ) : null}
          {error ? (
            <p
              className="text-center text-sm font-medium text-red-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  const className = `min-w-0 rounded-2xl border px-4 py-3 text-left transition ${
    active
      ? "border-accent bg-accent/15 ring-1 ring-accent"
      : "border-canvas/10 bg-fog"
  } ${
    clickable
      ? "cursor-pointer hover:border-accent/50 hover:bg-canvas/5"
      : ""
  }`;

  if (!clickable) {
    return (
      <div className={className}>
        <p className="truncate text-xs font-medium uppercase tracking-wide text-canvas/45">
          {label}
        </p>
        <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-canvas">
          {value}
        </p>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <p className="truncate text-xs font-medium uppercase tracking-wide text-canvas/45">
        {label}
      </p>
      <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-canvas">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-canvas/35">
        {active ? "Viewing" : "Click to view"}
      </p>
    </button>
  );
}

function OrderRow({
  order,
  busy,
  onStatus,
}: {
  order: AdminOrder;
  busy: boolean;
  onStatus: (status: string) => void;
}) {
  const actions = nextStatuses(order.status);
  const active = isActiveStatus(order.status);

  return (
    <li
      className={`min-w-0 px-4 py-4 sm:px-5 ${
        active ? "bg-fog" : "bg-ink/40"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              #{order.orderNumber}
            </p>
            <span
              className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                STATUS_TONE[order.status] ?? "bg-canvas/10 text-canvas/60"
              }`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 truncate text-base font-semibold text-canvas sm:text-lg">
            {order.customerName || "Guest"}
          </p>
          <p className="mt-0.5 truncate text-sm text-canvas/55">
            {order.station.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-canvas/40">
            {new Date(order.createdAt).toLocaleString("en-IN")}
            {order.paymentMethod
              ? ` · ${order.paymentMethod.toUpperCase()}`
              : ""}
          </p>
          {order.customerNote ? (
            <p className="mt-1 truncate text-xs text-canvas/45">
              Note: {order.customerNote}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-base font-semibold tabular-nums text-canvas sm:text-lg">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      <ul className="mt-3 space-y-1.5 rounded-xl border border-canvas/8 bg-ink/50 px-3 py-2.5 text-sm text-canvas/70">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 items-start justify-between gap-3"
          >
            <span className="min-w-0 break-words">
              {item.quantity}× {item.name}
            </span>
            <span className="shrink-0 tabular-nums text-canvas/55">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => onStatus(status)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                status === "CANCELLED"
                  ? "border border-canvas/15 text-canvas/50 hover:bg-canvas/5 hover:text-canvas"
                  : "bg-accent text-ink hover:brightness-95"
              }`}
            >
              Mark {STATUS_LABEL[status] ?? status}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
