"use client";

import {
  isAndroid,
  openUpiAppIfInstalled,
  upiAppLaunchHref,
  upiAppPlayStoreUrl,
  type UpiAppId,
} from "@/lib/upi";
import { useEffect, useState } from "react";

const APPS: Array<{ id: UpiAppId; label: string; src: string }> = [
  { id: "phonepe", label: "PhonePe", src: "/phonepe.png" },
  { id: "gpay", label: "GPay", src: "/gpay.png" },
  { id: "paytm", label: "Paytm", src: "/paytm.png" },
];

function UpiAppLink({
  app,
}: {
  app: (typeof APPS)[number];
}) {
  const [href, setHref] = useState(() => upiAppPlayStoreUrl(app.id));

  useEffect(() => {
    setHref(upiAppLaunchHref(app.id));
  }, [app.id]);

  return (
    <a
      href={href}
      onClick={(e) => {
        e.stopPropagation();
        // Android Chrome must follow the intent:// href itself.
        if (isAndroid()) return;
        e.preventDefault();
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
    </a>
  );
}

export function UpiAppIcons() {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Pay with UPI (optional)</p>
      <p className="mb-2 text-xs text-ink/50">
        Tap an app to open it. If it is not installed, you will be taken to the
        Play Store or App Store. Scan the station payment QR — this does not
        place your order.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <UpiAppLink key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
