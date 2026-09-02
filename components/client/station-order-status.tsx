"use client";

import { formatPrice } from "@/lib/format";
import type { StationType } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export type StationOrder = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string | null;
  totalAmount: number;
  customerName: string;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Waiting for payment",
  PAID: "Paid — in queue",
  PREPARING: "Being prepared",
  READY: "Ready — on the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  PAID: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  PREPARING: "border-accent/40 bg-accent/15 text-accent",
  READY: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  DELIVERED: "border-canvas/15 bg-canvas/5 text-canvas/55",
  CANCELLED: "border-red-400/30 bg-red-400/10 text-red-300",
};

type StationOrderStatusProps = {
  stationType: StationType;
  stationNumber: number;
  /** Seed after placing an order so UI updates immediately */
  seedOrders?: StationOrder[];
};

export function StationOrderStatus({
  stationType,
  stationNumber,
  seedOrders,
}: StationOrderStatusProps) {
  const [orders, setOrders] = useState<StationOrder[]>(seedOrders ?? []);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams({
      stationType,
      stationNumber: String(stationNumber),
    });
    const res = await fetch(`/api/orders/station?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { orders: StationOrder[] };
    setOrders(data.orders);
  }, [stationType, stationNumber]);

  useEffect(() => {
    if (!seedOrders?.length) return;
    setOrders((prev) => {
      const byId = new Map(prev.map((o) => [o.id, o]));
      for (const order of seedOrders) byId.set(order.id, order);
      return Array.from(byId.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [seedOrders]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (orders.length === 0) return null;

  return (
    <section className="mb-5 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            Your station
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-canvas">
            Active order{orders.length === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="text-[11px] text-canvas/40">Updates live</p>
      </div>

      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className="overflow-hidden rounded-2xl border border-canvas/12 bg-fog"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-canvas/8 px-4 py-3">
              <div>
                <p className="text-xs text-canvas/45">
                  Order #{order.orderNumber}
                  {order.customerName ? ` · ${order.customerName}` : ""}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-canvas">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  STATUS_TONE[order.status] ?? STATUS_TONE.PAID
                }`}
              >
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <ul className="space-y-1.5 px-4 py-3 text-sm text-canvas/70">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="truncate">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-canvas/50">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {order.paymentMethod ? (
              <p className="border-t border-canvas/8 px-4 py-2 text-[11px] uppercase tracking-wide text-canvas/40">
                {order.paymentMethod} · we&apos;ll bring it to your seat
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Map API/create order payload into StationOrder shape */
export function toStationOrder(order: {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string | null;
  totalAmount: number;
  customerName: string;
  createdAt: string | Date;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}): StationOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    customerName: order.customerName,
    createdAt:
      typeof order.createdAt === "string"
        ? order.createdAt
        : order.createdAt.toISOString(),
    items: order.items,
  };
}
