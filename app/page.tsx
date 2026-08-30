import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full overflow-hidden bg-ink text-canvas">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(30,202,211,0.2),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.05),_transparent_40%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-accent">
          Food Ordering
        </p>
        <h1 className="brand-mark mt-3 text-4xl sm:text-6xl">
          <span className="block">Fallback</span>
          <span className="brand-mark-accent mt-1 block">Gaming Cafe</span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-canvas/60">
          Scan a QR at your PC or PlayStation, order snacks and drinks, and we
          deliver to your station.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/order/pc/1"
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Open PC 1 menu
          </Link>
          <Link
            href="/order/ps/1"
            className="rounded-2xl border border-canvas/20 bg-canvas/5 px-5 py-3 text-sm font-semibold text-canvas transition hover:border-canvas/40"
          >
            Open PS 1 menu
          </Link>
          <Link
            href="/admin"
            className="rounded-2xl border border-accent/40 px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
