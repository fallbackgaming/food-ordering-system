"use client";

import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type AdminOrder = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string | null;
  totalAmount: number;
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

function nextStatuses(current: string): string[] {
  if (current === "CANCELLED" || current === "DELIVERED") return [];
  const idx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? [STATUS_FLOW[idx + 1]!] : [];
  return [...next, "CANCELLED"];
}

type OrdersBoardProps = {
  initialOrders: AdminOrder[];
};

export function OrdersBoard({ initialOrders }: OrdersBoardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [pending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const id = window.setInterval(() => {
      startTransition(() => router.refresh());
    }, 8000);
    return () => window.clearInterval(id);
  }, [router]);

  const active = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
      ),
    [orders]
  );
  const done = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "DELIVERED" || o.status === "CANCELLED"
      ),
    [orders]
  );

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { order: AdminOrder & { createdAt: string } };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: data.order.status,
            }
          : o
      )
    );
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/50">
          {active.length} active · auto-refreshes
          {pending ? "…" : ""}
        </p>
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium hover:bg-ink/5"
        >
          Refresh
        </button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/15 px-4 py-10 text-center text-sm text-ink/50">
          No active orders yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {active.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={updatingId === order.id}
              onStatus={(status) => void updateStatus(order.id, status)}
            />
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/45">
            Completed
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {done.slice(0, 12).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                busy={false}
                onStatus={() => undefined}
                compact
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onStatus,
  compact,
}: {
  order: AdminOrder;
  busy: boolean;
  onStatus: (status: string) => void;
  compact?: boolean;
}) {
  const actions = nextStatuses(order.status);

  return (
    <li className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            #{order.orderNumber} · {order.station.name}
          </p>
          <p className="mt-1 text-lg font-semibold">
            {STATUS_LABEL[order.status] ?? order.status}
          </p>
          <p className="text-xs text-ink/45">
            {new Date(order.createdAt).toLocaleString("en-IN")}
            {order.paymentMethod
              ? ` · ${order.paymentMethod.toUpperCase()}`
              : ""}
          </p>
        </div>
        <p className="font-semibold tabular-nums">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      <ul className="mt-3 space-y-1 border-t border-ink/8 pt-3 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2 text-ink/75">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span className="tabular-nums">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {!compact && actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => onStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                status === "CANCELLED"
                  ? "border border-ink/15 text-ink/60 hover:bg-ink/5"
                  : "bg-ink text-canvas hover:bg-ink/90"
              }`}
            >
              {STATUS_LABEL[status] ?? status}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
