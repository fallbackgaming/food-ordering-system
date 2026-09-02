"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { FoodLoader } from "@/components/ui/food-loader";

const BASE_NAV = [
  { href: "/admin", label: "Orders", match: (path: string) => path === "/admin" },
  {
    href: "/admin/analytics",
    label: "Analytics",
    match: (path: string) => path.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/place-order",
    label: "Place order",
    match: (path: string) => path.startsWith("/admin/place-order"),
  },
  {
    href: "/admin/menu",
    label: "Menu",
    match: (path: string) => path.startsWith("/admin/menu"),
  },
  {
    href: "/admin/qr",
    label: "QR codes",
    match: (path: string) => path.startsWith("/admin/qr"),
  },
] as const;

const STAFF_NAV = {
  href: "/admin/staff",
  label: "Staff",
  match: (path: string) => path.startsWith("/admin/staff"),
} as const;

type AdminShellProps = {
  children: React.ReactNode;
  isSuperAdmin?: boolean;
};

export function AdminShell({
  children,
  isSuperAdmin = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  const nav = isSuperAdmin ? [...BASE_NAV, STAFF_NAV] : [...BASE_NAV];

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  function onNavClick(isActive: boolean) {
    if (!isActive) setNavigating(true);
  }

  return (
    <div className="flex min-h-full bg-ink text-canvas">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-canvas/10 bg-ink md:flex">
        <div className="border-b border-canvas/10 px-5 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
            Food Ordering
          </p>
          <p className="brand-mark mt-2 text-xl leading-none">Fallback</p>
          <p className="brand-mark-accent mt-1 text-lg leading-none">
            Gaming Cafe
          </p>
          <p className="mt-2 text-xs text-canvas/45">
            {isSuperAdmin ? "Super admin" : "Admin dashboard"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavClick(active)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-ink"
                    : "text-canvas/70 hover:bg-canvas/10 hover:text-canvas"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-canvas/10 p-3">
          <AdminLogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-mist text-canvas">
        <header className="sticky top-0 z-20 border-b border-canvas/10 bg-ink/95 backdrop-blur">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0 md:hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                Fallback Gaming Cafe
              </p>
              <p className="font-semibold">Admin</p>
            </div>
            <nav className="flex min-w-0 gap-1 overflow-x-auto md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nav.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onNavClick(active)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      active ? "bg-accent text-ink" : "text-canvas/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto hidden text-sm text-canvas/45 md:block">
              Staff console
            </div>
            <div className="shrink-0 md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 md:px-6">
          {navigating ? (
            <div className="absolute inset-0 z-30 flex items-start justify-center bg-mist/85 pt-16 backdrop-blur-[2px]">
              <FoodLoader
                fullScreen={false}
                tone="dark"
                label="Loading page…"
              />
            </div>
          ) : null}
          <div
            className={
              navigating ? "pointer-events-none opacity-40" : undefined
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
