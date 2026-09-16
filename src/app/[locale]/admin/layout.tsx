import { getSession } from "@/lib/auth";
import { isStaffRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role={session.role} />
      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader user={{ email: session.email, role: session.role }} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
