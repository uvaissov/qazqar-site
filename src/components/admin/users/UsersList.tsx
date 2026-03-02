"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  _count: { bookings: number };
};

const roleBadge: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  CLIENT: "bg-blue-100 text-blue-800",
};

export default function UsersList({ users }: { users: User[] }) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t("error"));
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(t("confirmDelete", { name }))) return;
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t("error"));
      }
    } finally {
      setLoading(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("name")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Email
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("phone")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("role")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("bookingsCount")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("registered")}
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{user.phone || "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role] || "bg-gray-100 text-gray-800"}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {user._count.bookings}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(user.createdAt).toLocaleDateString(dateLocale)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={loading === user.id}
                    className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="CLIENT">CLIENT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    onClick={() =>
                      handleDelete(
                        user.id,
                        `${user.firstName} ${user.lastName}`
                      )
                    }
                    disabled={loading === user.id}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {t("delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
