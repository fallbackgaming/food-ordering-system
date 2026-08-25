import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/logout-button";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="border-b border-ink/10 bg-ink text-canvas">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
              Cyber Cafe
            </p>
            <p className="text-lg font-semibold tracking-tight">Admin</p>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-canvas/80 transition hover:bg-canvas/10 hover:text-canvas"
            >
              Orders
            </Link>
            <Link
              href="/admin/menu"
              className="rounded-lg px-3 py-2 text-canvas/80 transition hover:bg-canvas/10 hover:text-canvas"
            >
              Menu
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
