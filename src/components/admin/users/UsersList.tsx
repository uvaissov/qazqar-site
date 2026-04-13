"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";

type CrmCandidate = {
  id: number;
  name: string;
  phone: string;
  email: string;
  iin: string | null;
};

type CrmClientDetail = {
  id: number;
  name: string;
  phone: string;
  email: string;
  iin: string | null;
  agreement_id: string | null;
  orders_count: number;
  orders_amount: string;
  orders_paid_amount: string;
  orders_debt_amount: string;
  last_rent_date: string | null;
  comment: string;
  created_at: string;
};

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  iin: string | null;
  clientId: number | null;
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
  const [linkModal, setLinkModal] = useState<{ userId: string; candidates: CrmCandidate[] } | null>(null);
  const [clientCard, setClientCard] = useState<{ userId: string; data: CrmClientDetail } | null>(null);

  async function handleUnlinkCrm(userId: string) {
    if (!confirm(t("confirmUnlink"))) return;
    setLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}/link-crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: null }),
      });
      setClientCard(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleShowClient(userId: string, clientId: number) {
    setLoading(String(clientId));
    try {
      const res = await fetch(`/api/admin/crm-client/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClientCard({ userId, data });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleLinkCrm(userId: string) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/link-crm`);
      const data = await res.json();
      if (data.candidates?.length > 0) {
        setLinkModal({ userId, candidates: data.candidates });
      } else {
        alert(t("crmNotFound"));
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleSelectCandidate(userId: string, clientId: number) {
    setLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}/link-crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      setLinkModal(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

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
              CRM
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
              <td className="px-4 py-3">
                {user.role === "ADMIN" ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : user.clientId ? (
                  <button
                    onClick={() => handleShowClient(user.id, user.clientId!)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 transition-colors cursor-pointer shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    CRM #{user.clientId}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkCrm(user.id)}
                    disabled={loading === user.id}
                    className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                  >
                    {loading === user.id ? "..." : t("linkCrm")}
                  </button>
                )}
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

      {/* CRM client detail modal */}
      {clientCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClientCard(null)}>
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t("crmClient")}</h3>
              <button onClick={() => setClientCard(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("name")}</p>
                  <p className="font-medium text-gray-900">{clientCard.data.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">ID</p>
                  <p className="font-medium text-gray-900">#{clientCard.data.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("phone")}</p>
                  <p className="text-gray-700">{clientCard.data.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Email</p>
                  <p className="text-gray-700">{clientCard.data.email || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("iin")}</p>
                  <p className="text-gray-700">{clientCard.data.iin || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("agreement")}</p>
                  <p className="text-gray-700">{clientCard.data.agreement_id || "—"}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("ordersCount")}</p>
                  <p className="text-xl font-bold text-gray-900">{clientCard.data.orders_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("ordersTotal")}</p>
                  <p className="text-xl font-bold text-green-600">{Number(clientCard.data.orders_amount).toLocaleString()} &#8376;</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("debt")}</p>
                  <p className={`text-xl font-bold ${Number(clientCard.data.orders_debt_amount) > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {Number(clientCard.data.orders_debt_amount).toLocaleString()} &#8376;
                  </p>
                </div>
              </div>

              {clientCard.data.last_rent_date && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("lastRent")}</p>
                  <p className="text-gray-700">{new Date(clientCard.data.last_rent_date).toLocaleDateString(dateLocale)}</p>
                </div>
              )}

              {clientCard.data.comment && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">{t("commentLabel")}</p>
                  <p className="text-gray-600 text-sm">{clientCard.data.comment}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex gap-2">
                <button
                  onClick={() => {
                    setClientCard(null);
                    handleLinkCrm(clientCard.userId);
                  }}
                  disabled={loading === clientCard.userId}
                  className="flex-1 rounded-lg border border-cyan-200 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-50 transition-colors disabled:opacity-50"
                >
                  {t("relinkCrm")}
                </button>
                <button
                  onClick={() => handleUnlinkCrm(clientCard.userId)}
                  disabled={loading === clientCard.userId}
                  className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {t("unlinkCrm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM candidate selection modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{t("selectClient")}</h3>
            <p className="mb-4 text-sm text-gray-500">{t("multipleClients")}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {linkModal.candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCandidate(linkModal.userId, c.id)}
                  disabled={loading === linkModal.userId}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-cyan-500 hover:bg-cyan-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {c.phone} {c.iin && `| ИИН: ${c.iin}`}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setLinkModal(null)}
              className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
