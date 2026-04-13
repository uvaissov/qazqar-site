"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type SyncData = {
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  result: { cars: number; rented: number; booked: number } | null;
};

export default function SyncStatus() {
  const t = useTranslations("adminCars");
  const [sync, setSync] = useState<SyncData | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    try {
      const res = await fetch("/api/admin/sync");
      if (res.ok) setSync(await res.json());
    } catch {
      // ignore
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (res.ok) {
        setSync(await res.json());
        window.location.reload();
      }
    } finally {
      setSyncing(false);
    }
  }

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadStatus();
    const statusInterval = setInterval(loadStatus, 10_000);
    const tickInterval = setInterval(() => setNow(Date.now()), 1_000);
    return () => { clearInterval(statusInterval); clearInterval(tickInterval); };
  }, []);

  function timeAgo(iso: string) {
    const diff = Math.floor((now - new Date(iso).getTime()) / 1000);
    if (diff < 5) return t("justNow");
    if (diff < 60) return `${diff} ${t("secAgo")}`;
    return `${Math.floor(diff / 60)} ${t("minAgo")}`;
  }

  function timeUntil(iso: string) {
    const diff = Math.floor((new Date(iso).getTime() - now) / 1000);
    if (diff <= 0) return t("soon");
    if (diff < 60) return `${diff} ${t("secLeft")}`;
    return `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, "0")}`;
  }

  if (!sync) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${sync.lastSyncAt ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        <span className="text-gray-500">{t("lastSync")}:</span>
        <span className="font-medium text-gray-900">
          {sync.lastSyncAt ? timeAgo(sync.lastSyncAt) : "—"}
        </span>
      </div>

      {sync.nextSyncAt && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{t("nextSync")}:</span>
          <span className="font-medium text-gray-700 tabular-nums">{timeUntil(sync.nextSyncAt)}</span>
        </div>
      )}

      {sync.result && (
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full font-medium">
            {sync.result.cars} {t("carsCount")}
          </span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
            {sync.result.rented} {t("rentedCount")}
          </span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
            {sync.result.booked} {t("bookedCount")}
          </span>
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={syncing}
        className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg
          className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
          />
        </svg>
        {syncing ? t("syncing") : t("syncNow")}
      </button>
    </div>
  );
}
