"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);

    const data = (await res.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    if (!res.ok) {
      setError(data?.error ?? "Could not create account");
      return;
    }

    setSuccess(
      data?.message ??
        "Account created. Wait for a super admin to activate you."
    );
    setUsername("");
    setPassword("");
    setConfirm("");
  }

  return (
    <main className="menu-hero mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16 text-canvas">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
        Staff signup
      </p>
      <h1 className="brand-mark mt-3 text-[2.35rem] leading-none">
        <span className="block">Create</span>
        <span className="brand-mark-accent mt-1 block text-[1.75rem]">
          admin account
        </span>
      </h1>
      <p className="mt-4 text-sm text-canvas/55">
        New accounts stay inactive until a super admin approves them.
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
            minLength={3}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-canvas/80">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input-dark mt-1.5"
            minLength={8}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-canvas/80">
            Confirm password
          </span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field-input-dark mt-1.5"
            minLength={8}
            required
          />
        </label>

        {error ? (
          <p className="text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm font-medium text-accent" role="status">
            {success}{" "}
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="underline underline-offset-2"
            >
              Go to login
            </button>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-canvas/45">
        Already have an account?{" "}
        <Link
          href="/admin/login"
          className="font-medium text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
