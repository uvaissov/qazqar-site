"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface FaqItem {
  id: string;
  questionRu: string;
  questionKz: string;
  answerRu: string;
  answerKz: string;
  sortOrder: number;
  published: boolean;
}

interface FaqManagerProps {
  items: FaqItem[];
}

const emptyForm = {
  questionRu: "",
  questionKz: "",
  answerRu: "",
  answerKz: "",
  sortOrder: 0,
  published: true,
};

export default function FaqManager({ items }: FaqManagerProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      questionRu: item.questionRu,
      questionKz: item.questionKz,
      answerRu: item.answerRu,
      answerKz: item.answerKz,
      sortOrder: item.sortOrder,
      published: item.published,
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
    if (!form.questionRu || !form.answerRu) return;
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/faq/${editingId}`
        : "/api/admin/faq";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("question")} (RU) *
          </label>
          <input
            type="text"
            value={form.questionRu}
            onChange={(e) => setForm({ ...form, questionRu: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("question")} (KZ)
          </label>
          <input
            type="text"
            value={form.questionKz}
            onChange={(e) => setForm({ ...form, questionKz: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("answer")} (RU) *
          </label>
          <textarea
            value={form.answerRu}
            onChange={(e) => setForm({ ...form, answerRu: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("answer")} (KZ)
          </label>
          <textarea
            value={form.answerKz}
            onChange={(e) => setForm({ ...form, answerKz: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("sortOrder")}
          </label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value) })
            }
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="faq-published"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
          />
          <label
            htmlFor="faq-published"
            className="text-sm font-medium text-gray-700"
          >
            {t("published")}
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !form.questionRu || !form.answerRu}
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
          {t("addFaq")}
        </button>
      )}

      {/* Add form */}
      {showAdd && renderForm()}

      {/* List */}
      {items.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                renderForm()
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">
                          #{item.sortOrder}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            item.published
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.published ? t("published") : t("draft")}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.questionRu}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.answerRu}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
