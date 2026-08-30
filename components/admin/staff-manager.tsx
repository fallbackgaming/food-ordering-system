"use client";

import { useState } from "react";

export type StaffUser = {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StaffManagerProps = {
  initialUsers: StaffUser[];
  currentUserId: string;
};

export function StaffManager({
  initialUsers,
  currentUserId,
}: StaffManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = users.filter((u) => !u.isActive).length;
  const active = users.filter((u) => u.isActive).length;

  async function setActive(user: StaffUser, isActive: boolean) {
    setBusyId(user.id);
    setError(null);
    const res = await fetch(`/api/admin/staff/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setBusyId(null);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not update user");
      return;
    }

    const data = (await res.json()) as { user: StaffUser };
    setUsers((prev) =>
      prev.map((row) => (row.id === user.id ? data.user : row))
    );
  }

  return (
    <div className="space-y-6 text-canvas">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total staff" value={String(users.length)} />
        <Stat label="Active" value={String(active)} />
        <Stat label="Pending / inactive" value={String(pending)} />
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-canvas/10 bg-fog">
        <div className="border-b border-canvas/10 px-5 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            Access control
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Admin accounts
          </h2>
          <p className="mt-1 text-sm text-canvas/45">
            Activate new signups to grant access. Deactivate when staff leave.
          </p>
        </div>

        <ul className="divide-y divide-canvas/8">
          {users.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-canvas/45">
              No staff accounts yet.
            </li>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-canvas">
                        {user.username}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-accent/20 text-accent"
                            : "bg-canvas/10 text-canvas/60"
                        }`}
                      >
                        {user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                      </span>
                      {isSelf ? (
                        <span className="text-[11px] text-canvas/40">You</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-canvas/40">
                      Joined{" "}
                      {new Date(user.createdAt).toLocaleString("en-IN")}
                      {" · "}
                      {user.isActive ? "Can sign in" : "Awaiting approval"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>

                  <button
                    type="button"
                    disabled={busyId === user.id || (isSelf && user.isActive)}
                    onClick={() => void setActive(user, !user.isActive)}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      user.isActive
                        ? "border border-canvas/15 text-canvas/70 hover:bg-canvas/5 hover:text-canvas"
                        : "bg-accent text-ink hover:brightness-95"
                    }`}
                  >
                    {busyId === user.id
                      ? "Saving…"
                      : user.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-canvas/10 bg-fog px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-canvas/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
