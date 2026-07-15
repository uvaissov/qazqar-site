"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type Banner = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  locale: string | null;
  sortOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

/** ISO из БД → значение для <input type="date">. Пустая строка, если не задано. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export default function BannerManager({ initial }: { initial: Banner[] }) {
  const t = useTranslations("adminBanners");
  const [banners, setBanners] = useState<Banner[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  }

  async function addBanner(file: File) {
    setError("");
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      if (!imageUrl) {
        setError(t("imageRequired"));
        return;
      }
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          // Новый баннер уезжает в конец: иначе он молча встанет первым и
          // подвинет то, что уже настроено.
          sortOrder: banners.length,
        }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? "Error");
        return;
      }
      const created: Banner = await res.json();
      setBanners((prev) => [...prev, created]);
    } finally {
      setUploading(false);
    }
  }

  async function patch(id: string, data: Partial<Banner>) {
    setError("");
    // Оптимистично: правки мелкие и частые, ждать ответ на каждый чих незачем.
    const prev = banners;
    setBanners((list) =>
      list.map((b) => (b.id === id ? { ...b, ...data } : b))
    );

    const res = await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      // Сервер отказал — откатываем, иначе экран врал бы про сохранённое.
      setBanners(prev);
      const body = await res.json().catch(() => ({}));
      setError(body.error === "BAD_PERIOD" ? t("badPeriod") : "Error");
    }
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) setBanners((list) => list.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">
        {uploading ? t("uploading") : t("add")}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addBanner(file);
            // Сбрасываем, иначе повторный выбор того же файла не сработает.
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-xs text-gray-500">{t("imageHint")}</p>

      {banners.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-48">
                <Image
                  src={b.imageUrl}
                  alt=""
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>

              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">{t("link")}</span>
                  <input
                    type="url"
                    defaultValue={b.linkUrl ?? ""}
                    placeholder="https://…"
                    onBlur={(e) => patch(b.id, { linkUrl: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5"
                  />
                  <span className="mt-1 block text-xs text-gray-400">
                    {t("linkHint")}
                  </span>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">{t("locale")}</span>
                  <select
                    defaultValue={b.locale ?? ""}
                    onChange={(e) => patch(b.id, { locale: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5"
                  >
                    <option value="">{t("localeAll")}</option>
                    <option value="ru">Русский</option>
                    <option value="kz">Қазақша</option>
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">
                    {t("period")} — {t("from")}
                  </span>
                  <input
                    type="date"
                    defaultValue={toDateInput(b.startsAt)}
                    onChange={(e) => patch(b.id, { startsAt: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">
                    {t("period")} — {t("to")}
                  </span>
                  <input
                    type="date"
                    defaultValue={toDateInput(b.endsAt)}
                    onChange={(e) => patch(b.id, { endsAt: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5"
                  />
                  <span className="mt-1 block text-xs text-gray-400">
                    {t("periodHint")}
                  </span>
                </label>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={(e) => patch(b.id, { active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  {t("active")}
                </label>

                <label className="flex items-center gap-2 text-sm">
                  {t("sortOrder")}
                  <input
                    type="number"
                    defaultValue={b.sortOrder}
                    onBlur={(e) =>
                      patch(b.id, { sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 rounded-md border border-gray-300 px-2 py-1"
                  />
                </label>

                <button
                  onClick={() => remove(b.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
