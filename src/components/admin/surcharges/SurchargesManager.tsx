"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Surcharge {
  id: string;
  minDay: number;
  maxDay: number;
  percent: number;
}

interface AppSetting {
  id: string;
  key: string;
  value: string;
}

interface SurchargesManagerProps {
  surcharges: Surcharge[];
  settings: AppSetting[];
}

const emptyForm = {
  minDay: "",
  maxDay: "",
  percent: "",
};

export default function SurchargesManager({ surcharges, settings }: SurchargesManagerProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Settings state
  const vatSetting = settings.find(s => s.key === "vatPercent");
  const overflowSetting = settings.find(s => s.key === "overflowDailyPercent");
  const [vatPercent, setVatPercent] = useState(vatSetting?.value || "16");
  const [overflowPercent, setOverflowPercent] = useState(overflowSetting?.value || "0.44");
  const [savingSettings, setSavingSettings] = useState(false);

  const startEdit = (item: Surcharge) => {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      minDay: item.minDay.toString(),
      maxDay: item.maxDay.toString(),
      percent: item.percent.toString(),
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
    if (!form.minDay || !form.maxDay || !form.percent) return;
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/surcharges/${editingId}`
        : "/api/admin/surcharges";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDay: Number(form.minDay),
          maxDay: Number(form.maxDay),
          percent: Number(form.percent),
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
      const res = await fetch(`/api/admin/surcharges/${id}`, {
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

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "vatPercent", value: vatPercent },
            { key: "overflowDailyPercent", value: overflowPercent },
          ],
        }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setSavingSettings(false);
    }
  };

  const renderForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            С дня *
          </label>
          <input
            type="number"
            value={form.minDay}
            onChange={(e) => setForm({ ...form, minDay: e.target.value })}
            min={1}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            По день *
          </label>
          <input
            type="number"
            value={form.maxDay}
            onChange={(e) => setForm({ ...form, maxDay: e.target.value })}
            min={1}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardoo (%) *
          </label>
          <input
            type="number"
            value={form.percent}
            onChange={(e) => setForm({ ...form, percent: e.target.value })}
            min={0}
            step={0.01}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.minDay || !form.maxDay || !form.percent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
    <div className="space-y-6">
      {/* Settings card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Глобальные настройки</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">НДС (%)</label>
            <input
              type="number"
              value={vatPercent}
              onChange={(e) => setVatPercent(e.target.value)}
              min={0}
              step={0.1}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Шаг %/день (overflow)</label>
            <input
              type="number"
              value={overflowPercent}
              onChange={(e) => setOverflowPercent(e.target.value)}
              min={0}
              step={0.01}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
          >
            {savingSettings ? "..." : t("save")}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Формула: депозит × процент / 100 × (1 + НДС / 100). Если дней больше чем в таблице — берётся последний % + шаг × дней сверх.
        </p>
      </div>

      {/* Add button */}
      {!showAdd && !editingId && (
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("addSurcharge")}
        </button>
      )}

      {showAdd && renderForm()}

      {/* Table */}
      {surcharges.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">С дня</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">По день</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cardoo (%)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Пример (100 000 ₸)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {surcharges.map((item) => {
                  const vat = Number(vatPercent) || 0;
                  const example = Math.round(100000 * item.percent / 100 * (1 + vat / 100));
                  return (
                    <tr key={item.id}>
                      {editingId === item.id ? (
                        <td colSpan={5} className="p-0">{renderForm()}</td>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.minDay}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.maxDay}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.percent}%</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{example.toLocaleString()} ₸</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => startEdit(item)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">{t("edit")}</button>
                              <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">{t("delete")}</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
