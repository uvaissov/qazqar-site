"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");
  const [loading, setLoading] = useState<string | null>(null);

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

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        {t("empty")}
      </div>
    );
  }

  return (
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
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
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
  );
}
