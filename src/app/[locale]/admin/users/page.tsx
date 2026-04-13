import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import UsersList from "@/components/admin/users/UsersList";

export default async function AdminUsersPage() {
  await requireAdmin();
  const t = await getTranslations("adminUsers");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      iin: true,
      clientId: true,
      role: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <span className="text-sm text-gray-500">
          {t("total")}: {users.length}
        </span>
      </div>
      <UsersList users={serialized} />
    </div>
  );
}
