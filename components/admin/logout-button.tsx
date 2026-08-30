"use client";

import { useState } from "react";

type AdminLogoutButtonProps = {
  dark?: boolean;
};

export function AdminLogoutButton({ dark }: AdminLogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
    } catch {
      // Still leave the admin area even if the request fails
    }
    // Hard navigation avoids RSC refresh of a protected page after cookie clear
    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      className={
        dark
          ? "rounded-lg px-3 py-2 text-sm text-ink/60 transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
          : "w-full rounded-lg px-3 py-2 text-left text-sm text-canvas/70 transition hover:bg-canvas/10 hover:text-canvas disabled:opacity-50"
      }
    >
      {loading ? "…" : "Log out"}
    </button>
  );
}
