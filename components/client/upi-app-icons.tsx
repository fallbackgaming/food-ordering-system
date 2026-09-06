"use client";

import { openUpiAppIfInstalled } from "@/lib/upi";

function PhonePeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#5F259F" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        पे
      </text>
    </svg>
  );
}

function GpayIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#fff" />
      <path
        fill="#4285F4"
        d="M16.4 15.2v3.3h4.7c-.2 1.2-1.4 3.5-4.7 3.5-2.8 0-5.1-2.3-5.1-5.2s2.3-5.2 5.1-5.2c1.6 0 2.7.7 3.3 1.3l2.3-2.2C20.6 9.4 18.7 8.5 16.4 8.5 12.2 8.5 8.8 11.9 8.8 16.2s3.4 7.7 7.6 7.7c4.4 0 7.3-3.1 7.3-7.4 0-.5 0-.8-.1-1.2h-7.2z"
      />
    </svg>
  );
}

function PaytmIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#00BAF2" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        pay
      </text>
    </svg>
  );
}

const APPS = [
  { id: "phonepe" as const, label: "PhonePe", icon: PhonePeIcon },
  { id: "gpay" as const, label: "GPay", icon: GpayIcon },
  { id: "paytm" as const, label: "Paytm", icon: PaytmIcon },
];

export function UpiAppIcons() {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Pay with UPI (optional)</p>
      <p className="mb-2 text-xs text-ink/50">
        Opens the app if it is installed so you can scan the station payment QR.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => openUpiAppIfInstalled(app.id)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-ink/10 bg-panel px-2 py-3 transition hover:border-ink/20"
          >
            {app.icon()}
            <span className="text-[11px] font-semibold">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
