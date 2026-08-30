import { StaffLoginLink } from "@/components/staff-login-link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full overflow-hidden bg-ink text-canvas">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(30,202,211,0.2),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.05),_transparent_40%)]"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <StaffLoginLink />
      </div>

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
      </div>
    </main>
  );
}
