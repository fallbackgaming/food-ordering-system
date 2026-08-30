import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell isSuperAdmin={session.role === "SUPER_ADMIN"}>
      {children}
    </AdminShell>
  );
}
