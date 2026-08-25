"use client";

import { CartSheet } from "@/components/client/cart-sheet";
import { CheckoutDialog } from "@/components/client/checkout-dialog";
import { MenuList } from "@/components/client/menu-list";
import type { CartLine, MenuItem, PaymentMethod, StationType } from "@/lib/types";
import { useMemo, useState } from "react";

type OrderMenuProps = {
  items: MenuItem[];
  stationLabel: string;
  stationType: StationType;
  stationNumber: number;
};

export function OrderMenu({
  items,
  stationLabel,
  stationType,
  stationNumber,
}: OrderMenuProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLines, setCheckoutLines] = useState<CartLine[]>([]);

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of lines) map[line.menuItemId] = line.quantity;
    return map;
  }, [lines]);

  function addItem(item: MenuItem) {
    if (!item.isAvailable) return;

    setLines((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          emoji: item.emoji,
          quantity: 1,
        },
      ];
    });
  }

  function decrement(menuItemId: string) {
    setLines((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: line.quantity - 1 }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function increment(menuItemId: string) {
    const item = items.find((i) => i.id === menuItemId);
    if (!item) return;
    addItem(item);
  }

  function openCheckout() {
    setCheckoutLines(lines);
    setCheckoutOpen(true);
  }

  async function placeOrder(
    method: Extract<PaymentMethod, "cash" | "upi">
  ) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationType,
        stationNumber,
        paymentMethod: method,
        items: checkoutLines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? "Could not place order");
    }

    setLines([]);
  }

  return (
    <>
      <MenuList
        items={items}
        quantities={quantities}
        onAdd={addItem}
        onDecrement={decrement}
      />
      <CartSheet
        lines={lines}
        onIncrement={increment}
        onDecrement={decrement}
        onClear={() => setLines([])}
        onCheckout={openCheckout}
      />
      <CheckoutDialog
        open={checkoutOpen}
        lines={checkoutLines}
        stationLabel={stationLabel}
        onClose={() => setCheckoutOpen(false)}
        onPlaceOrder={placeOrder}
      />
    </>
  );
}
