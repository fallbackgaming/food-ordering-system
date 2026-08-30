"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next?.startsWith("/admin")) setNextPath(next);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Login failed");
        setLoading(false);
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setError("Could not reach the server");
      setLoading(false);
    }
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

      <p className="mt-6 text-center text-sm text-canvas/45">
        Need an account?{" "}
        <Link
          href="/admin/signup"
          className="font-medium text-accent hover:underline"
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}
