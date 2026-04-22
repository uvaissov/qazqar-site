"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardColumn } from "./DashboardColumn";
import { ToastHost, type ToastItem } from "./ToastHost";
import { useBeep } from "./hooks/useBeep";
import { useDashboardFeed } from "./hooks/useDashboardFeed";
import { useTitleBadge } from "./hooks/useTitleBadge";
import type { DashboardBooking } from "@/components/admin/types";

export function AdminDashboard() {
  const router = useRouter();
  const beep = useBeep();
  const { data, error, loading } = useDashboardFeed();

  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingBadge, setPendingBadge] = useState(0);
  const [returnBadge, setReturnBadge] = useState(0);

  const pendingTotal = data?.pending.length ?? 0;
  const returnTotal = data?.returnPending.length ?? 0;
  const hasAlert = pendingBadge > 0 || returnBadge > 0;

  useTitleBadge(pendingTotal, returnTotal, hasAlert);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (b: DashboardBooking, kind: "pending" | "return") => {
      const title =
        kind === "pending" ? "Новая заявка" : "Заявка на проверке";
      const body = `${b.customerName || "—"} · ${
        b.car ? `${b.car.brand} ${b.car.modelName}` : "авто не указано"
      }`;
      setToasts((prev) => [
        ...prev,
        {
          id: `${b.id}:${kind}:${Date.now()}`,
          kind,
          title,
          body,
          onClick: () => router.push(`/admin/bookings/${b.id}`),
        },
      ]);
    },
    [router]
  );

  useEffect(() => {
    if (!data) return;
    const allIds = [...data.pending, ...data.returnPending].map((b) => b.id);

    if (firstLoadRef.current) {
      allIds.forEach((id) => seenIdsRef.current.add(id));
      firstLoadRef.current = false;
      return;
    }

    const newPending = data.pending.filter(
      (b) => !seenIdsRef.current.has(b.id)
    );
    const newReturn = data.returnPending.filter(
      (b) => !seenIdsRef.current.has(b.id)
    );

    if (newPending.length > 0 || newReturn.length > 0) {
      beep();
      newPending.forEach((b) => pushToast(b, "pending"));
      newReturn.forEach((b) => pushToast(b, "return"));
      if (newPending.length > 0) setPendingBadge((n) => n + newPending.length);
      if (newReturn.length > 0) setReturnBadge((n) => n + newReturn.length);
    }

    allIds.forEach((id) => seenIdsRef.current.add(id));
  }, [data, beep, pushToast]);

  useEffect(() => {
    const reset = () => {
      if (document.visibilityState === "visible") {
        setPendingBadge(0);
        setReturnBadge(0);
      }
    };
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("focus", reset);
    return () => {
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("focus", reset);
    };
  }, []);

  const pending = useMemo(() => data?.pending ?? [], [data]);
  const returnPending = useMemo(() => data?.returnPending ?? [], [data]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const agoLabel = useMemo(() => {
    if (!data?.serverTs) return null;
    void tick; // re-evaluate every tick
    const secs = Math.max(
      0,
      Math.round((Date.now() - new Date(data.serverTs).getTime()) / 1000)
    );
    if (secs < 2) return "только что";
    if (secs < 60) return `${secs} сек назад`;
    const mins = Math.round(secs / 60);
    return `${mins} мин назад`;
  }, [data?.serverTs, tick]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Требуют внимания
        </h2>
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          {loading && !data ? (
            "загрузка…"
          ) : error ? (
            <span className="text-red-500">ошибка: {error}</span>
          ) : (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              обновлено {agoLabel ?? "—"}
            </>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardColumn
          title="Новые заявки"
          accent="amber"
          items={pending}
          emptyText="Нет новых заявок"
        />
        <DashboardColumn
          title="На проверке (возвраты)"
          accent="cyan"
          items={returnPending}
          emptyText="Нет заявок на проверке"
        />
      </div>
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
