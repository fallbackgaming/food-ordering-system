"use client";

import { openUpiAppIfInstalled, type UpiAppId } from "@/lib/upi";

const APPS: Array<{ id: UpiAppId; label: string; src: string }> = [
  { id: "phonepe", label: "PhonePe", src: "/phonepe.png" },
  { id: "gpay", label: "GPay", src: "/gpay.png" },
  { id: "paytm", label: "Paytm", src: "/paytm.png" },
];

export function UpiAppIcons() {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Pay with UPI (optional)</p>
      <p className="mb-2 text-xs text-ink/50">
        Tap an app to open it (if installed) and scan the station payment QR.
        This does not place your order.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openUpiAppIfInstalled(app.id);
            }}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-ink/10 bg-panel px-2 py-3 transition hover:border-ink/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.src}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
            <span className="text-[11px] font-semibold">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
