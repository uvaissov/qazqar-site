"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Plus, X } from "lucide-react";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  textRu: string;
  textKz: string;
  approved: boolean;
  createdAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              star <= value ? "text-yellow-400" : "text-gray-200 hover:text-yellow-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

type FormData = {
  authorName: string;
  rating: number;
  textRu: string;
  textKz: string;
  approved: boolean;
};

const emptyForm: FormData = { authorName: "", rating: 5, textRu: "", textKz: "", approved: true };

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");
  const locale = useLocale();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setModal({ mode: "create" });
  }

  function openEdit(review: Review) {
    setForm({
      authorName: review.authorName,
      rating: review.rating,
      textRu: review.textRu,
      textKz: review.textKz,
      approved: review.approved,
    });
    setModal({ mode: "edit", id: review.id });
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.authorName || !form.textRu) return;
    setSaving(true);
    try {
      const url = modal?.mode === "edit"
        ? `/api/admin/reviews/${modal.id}`
        : "/api/admin/reviews";
      const method = modal?.mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        closeModal();
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !currentApproved }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setLoading(id);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none";

  return (
    <>
      {/* Add button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 transition-colors"
        >
          <Plus size={16} />
          {t("addReview")}
        </button>
      </div>

      {reviews.length === 0 ? (
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
                    {t("author")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("rating")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("contentRu")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    {t("published")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {review.authorName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                        {review.textRu}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          review.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {review.approved ? t("approved") : t("pending")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(review)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleApproval(review.id, review.approved)
                          }
                          disabled={loading === review.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                            review.approved
                              ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                              : "text-green-600 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {review.approved ? t("reject") : t("approve")}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={loading === review.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
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
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === "create" ? t("addReview") : t("editReview")}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("reviewName")}</label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("rating")}</label>
                <StarInput value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("reviewTextRu")}</label>
                <textarea
                  value={form.textRu}
                  onChange={(e) => setForm({ ...form, textRu: e.target.value })}
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("reviewTextKz")}</label>
                <textarea
                  value={form.textKz}
                  onChange={(e) => setForm({ ...form, textKz: e.target.value })}
                  rows={4}
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.approved}
                  onChange={(e) => setForm({ ...form, approved: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-700">{t("approved")}</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.authorName || !form.textRu}
                className="flex-1 rounded-lg bg-cyan-500 py-2.5 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {saving ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
