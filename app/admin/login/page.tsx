"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Login failed");
      return;
    }

    router.replace(next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <main className="menu-hero mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16 text-canvas">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
        Admin access
      </p>
      <h1 className="brand-mark mt-3 text-[2.35rem] leading-none">
        <span className="block">Fallback</span>
        <span className="brand-mark-accent mt-1 block text-[1.75rem]">
          Gaming Cafe
        </span>
      </h1>
      <p className="mt-4 text-sm text-canvas/55">
        Sign in to monitor orders and manage the menu.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-canvas/80">Username</span>
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="field-input-dark mt-1.5"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-canvas/80">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input-dark mt-1.5"
            required
          />
        </label>

        {error ? (
          <p className="text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-full max-w-md items-center justify-center px-6">
          <p className="text-sm text-canvas/50">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
