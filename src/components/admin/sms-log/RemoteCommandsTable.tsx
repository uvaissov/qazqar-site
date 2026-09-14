"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatPhone } from "@/lib/phone";

type RemoteCommandItem = {
  id: string;
  createdAt: string;
  action: "UNLOCK" | "LOCK";
  ok: boolean;
  error: string | null;
  providerId: string | null;
  targetPhone: string;
  smsText: string;
  car: {
    id: string;
    number: string;
    model: string | null;
    brand: string | null;
  } | null;
  user: { name: string; email: string | null };
};

type ApiResponse = {
  items: RemoteCommandItem[];
  total: number;
  page: number;
  pageSize: number;
};

interface RemoteCommandsTableProps {
  // Если задан — журнал по одной машине (колонка «Машина» скрыта).
  carId?: string;
  // Показывать колонку «Машина» (для глобального журнала).
  showCar?: boolean;
}

const PAGE_SIZE = 20;

export default function RemoteCommandsTable({
  carId,
  showCar = false,
}: RemoteCommandsTableProps) {
  const t = useTranslations("adminSmsLog");
  const locale = useLocale();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";

  const [data, setData] = useState<ApiResponse | null>(null);
  const [page, setPage] = useState(1);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        status: errorsOnly ? "errors" : "all",
      });
      if (carId) params.set("carId", carId);
      const res = await fetch(`/api/admin/remote-commands?${params.toString()}`);
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as ApiResponse);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, errorsOnly, carId]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = data?.items ?? [];
  const colSpan = showCar ? 6 : 5;

  return (
    <div>
      {/* Фильтр статуса */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "all", active: !errorsOnly },
          { key: "errors", active: errorsOnly },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setErrorsOnly(tab.key === "errors");
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab.active
                ? "bg-cyan-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.key === "all" ? t("filterAll") : t("filterErrors")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {t("time")}
                </th>
                {showCar && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("car")}
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {t("action")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {t("status")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {t("who")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {t("phone")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                    {t("loading")}
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-red-500">
                    {t("loadError")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const isOpen = expanded === c.id;
                  const hasDetail = Boolean(c.error || c.providerId);
                  return (
                    <FragmentRow
                      key={c.id}
                      open={isOpen}
                      hasDetail={hasDetail}
                      colSpan={colSpan}
                      onToggle={() => setExpanded(isOpen ? null : c.id)}
                      detail={c.error || c.providerId || t("noValue")}
                      detailLabel={t("response")}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDateTime(c.createdAt)}
                      </td>
                      {showCar && (
                        <td className="px-4 py-3 text-gray-700">
                          {c.car ? (
                            <span>
                              <span className="font-medium">{c.car.number}</span>
                              {(c.car.brand || c.car.model) && (
                                <span className="text-gray-400 text-xs block">
                                  {[c.car.brand, c.car.model]
                                    .filter(Boolean)
                                    .join(" ")}
                                </span>
                              )}
                            </span>
                          ) : (
                            t("noValue")
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.action === "UNLOCK"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.action === "UNLOCK" ? t("open") : t("close")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.ok
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.ok ? t("statusOk") : t("statusFail")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span>{c.user.name || t("noValue")}</span>
                        {c.user.email && (
                          <span className="text-gray-400 text-xs block">
                            {c.user.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatPhone(c.targetPhone)}
                      </td>
                    </FragmentRow>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {!loading && !loadError && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {t("shown", { shown: items.length, total })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t("prev")}
            </button>
            <span className="text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t("next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Строка с раскрываемой деталью (error / сырой ответ шлюза).
function FragmentRow({
  children,
  detail,
  detailLabel,
  open,
  hasDetail,
  colSpan,
  onToggle,
}: {
  children: React.ReactNode;
  detail: string;
  detailLabel: string;
  open: boolean;
  hasDetail: boolean;
  colSpan: number;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`transition-colors ${hasDetail ? "cursor-pointer hover:bg-gray-50" : ""}`}
        onClick={hasDetail ? onToggle : undefined}
      >
        {children}
      </tr>
      {open && hasDetail && (
        <tr className="bg-gray-50">
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">{detailLabel}</div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono">
              {detail}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
