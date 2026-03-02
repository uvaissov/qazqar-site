"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface ModelFormProps {
  brandId: string;
  model?: { id: string; name: string; slug: string } | null;
  onSave: () => void;
  onCancel: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ModelForm({
  brandId,
  model,
  onSave,
  onCancel,
}: ModelFormProps) {
  const t = useTranslations("adminBrands");
  const [name, setName] = useState(model?.name || "");
  const [slug, setSlug] = useState(model?.slug || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = model
        ? `/api/admin/models/${model.id}`
        : "/api/admin/models";
      const method = model ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, brandId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      onSave();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-white rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700">
        {model ? t("editModel") : t("addModel")}
      </h4>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            placeholder="Camry"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("slug")}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            placeholder="camry"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : t("save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
