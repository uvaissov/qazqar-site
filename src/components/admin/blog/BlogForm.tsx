"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface BlogPostData {
  id: string;
  titleRu: string;
  titleKz: string;
  slug: string;
  contentRu: string;
  contentKz: string;
  coverImage: string | null;
  published: boolean;
}

interface BlogFormProps {
  mode: "create" | "edit";
  post?: BlogPostData;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[а-яёәіңғүұқөһ]/g, (char) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
        ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
        н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
        ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
        ы: "y", э: "e", ю: "yu", я: "ya",
        ә: "a", і: "i", ң: "n", ғ: "g", ү: "u", ұ: "u", қ: "k",
        ө: "o", һ: "h",
      };
      return map[char] || "";
    })
    .replace(/[ъь]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogForm({ mode, post }: BlogFormProps) {
  const router = useRouter();
  const t = useTranslations("adminContent");

  const [titleRu, setTitleRu] = useState(post?.titleRu || "");
  const [titleKz, setTitleKz] = useState(post?.titleKz || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [contentRu, setContentRu] = useState(post?.contentRu || "");
  const [contentKz, setContentKz] = useState(post?.contentKz || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create" && titleRu) {
      setSlug(generateSlug(titleRu));
    }
  }, [titleRu, mode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
      } else {
        setError("Failed to upload image");
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      titleRu,
      titleKz,
      slug,
      contentRu,
      contentKz,
      coverImage: coverImage || null,
      published,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/blog"
          : `/api/admin/blog/${post?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Title & Slug */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("titleRu")} / {t("titleKz")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("titleRu")} *
            </label>
            <input
              type="text"
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("titleKz")}
            </label>
            <input
              type="text"
              value={titleKz}
              onChange={(e) => setTitleKz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("slug")} *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="my-blog-post"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("contentRu")} / {t("contentKz")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("contentRu")} *
            </label>
            <textarea
              value={contentRu}
              onChange={(e) => setContentRu(e.target.value)}
              required
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("contentKz")}
            </label>
            <textarea
              value={contentKz}
              onChange={(e) => setContentKz(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
            />
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("coverImage")}
        </h2>
        <div className="space-y-3">
          {coverImage && (
            <div className="relative">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                x
              </button>
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
            {uploading ? (
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
            ) : (
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            )}
            {t("coverImage")}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Published toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
          />
          <label
            htmlFor="published"
            className="text-sm font-medium text-gray-700"
          >
            {t("published")}
          </label>
          <span
            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
              published
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {published ? t("published") : t("draft")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
