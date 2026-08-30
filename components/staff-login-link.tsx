import Link from "next/link";

type StaffLoginLinkProps = {
  className?: string;
};

export function StaffLoginLink({ className = "" }: StaffLoginLinkProps) {
  return (
    <Link
      href="/admin/login"
      aria-label="Staff login"
      title="Staff login"
      className={`inline-flex size-10 items-center justify-center rounded-xl border border-canvas/15 bg-canvas/5 text-canvas/70 transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Link>
  );
}
