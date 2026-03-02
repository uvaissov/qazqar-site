"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Discount {
  id: string;
  minDays: number;
  maxDays: number;
  percent: number;
  active: boolean;
}

interface DiscountsManagerProps {
  discounts: Discount[];
}

const emptyForm = {
  minDays: "",
  maxDays: "",
  percent: "",
  active: true,
};

export default function DiscountsManager({ discounts }: DiscountsManagerProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const startEdit = (item: Discount) => {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      minDays: item.minDays.toString(),
      maxDays: item.maxDays.toString(),
      percent: item.percent.toString(),
      active: item.active,
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setShowAdd(true);
    setForm(emptyForm);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.minDays || !form.maxDays || !form.percent) return;
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/discounts/${editingId}`
        : "/api/admin/discounts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDays: Number(form.minDays),
          maxDays: Number(form.maxDays),
          percent: Number(form.percent),
          active: form.active,
        }),
      });

      if (res.ok) {
        cancelEdit();
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const renderForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("minDays")} *
          </label>
          <input
            type="number"
            value={form.minDays}
            onChange={(e) => setForm({ ...form, minDays: e.target.value })}
            min={1}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("maxDays")} *
          </label>
          <input
            type="number"
            value={form.maxDays}
            onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
            min={1}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("percent")} (%) *
          </label>
          <input
            type="number"
            value={form.percent}
            onChange={(e) => setForm({ ...form, percent: e.target.value })}
            min={1}
            max={100}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            type="checkbox"
            id="discount-active"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
          />
          <label
            htmlFor="discount-active"
            className="text-sm font-medium text-gray-700"
          >
            {t("active")}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.minDays || !form.maxDays || !form.percent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {t("save")}
          </button>
          <button
            onClick={cancelEdit}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showAdd && !editingId && (
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {t("addDiscount")}
        </button>
      )}

      {/* Add form */}
      {showAdd && renderForm()}

      {/* Table */}
      {discounts.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("minDays")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("maxDays")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("percent")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("active")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts.map((item) => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <td colSpan={5} className="p-0">
                        {renderForm()}
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.minDays}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.maxDays}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.percent}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              item.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.active ? t("active") : t("inactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deleting === item.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
