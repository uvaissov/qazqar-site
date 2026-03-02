"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface BlogPost {
  id: string;
  titleRu: string;
  slug: string;
  published: boolean;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
}

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  if (posts.length === 0) {
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
                {t("titleRu")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("author")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("published")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("slug")}
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {post.titleRu}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {post.author.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      post.published
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {post.published ? t("published") : t("draft")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                  {post.slug}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
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
