import { StaffManager } from "@/components/admin/staff-manager";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          Staff access
        </h1>
        <p className="mt-1 text-sm text-canvas/50">
          Approve new admin signups and deactivate accounts that should no
          longer sign in.
        </p>
      </div>
      <StaffManager
        currentUserId={session.userId}
        initialUsers={users.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
