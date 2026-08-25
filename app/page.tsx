import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        Cyber Cafe
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Food Ordering
      </h1>
      <p className="mt-4 max-w-lg text-ink/70">
        Scan a QR at your PC or PlayStation, order snacks and drinks, and we
        deliver to your station.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/order/pc/1"
          className="bg-ink px-4 py-2 text-sm font-medium text-canvas"
        >
          Open PC 1 menu
        </Link>
        <Link
          href="/order/ps/1"
          className="border border-ink px-4 py-2 text-sm font-medium text-ink"
        >
          Open PS 1 menu
        </Link>
        <Link
          href="/admin"
          className="border border-accent px-4 py-2 text-sm font-medium text-ink"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
