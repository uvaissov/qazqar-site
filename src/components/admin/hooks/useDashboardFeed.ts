"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardBooking } from "../types";

export type DashboardFeed = {
  pending: DashboardBooking[];
  returnPending: DashboardBooking[];
  serverTs: string;
};

const POLL_INTERVAL_MS = 10_000;

export function useDashboardFeed() {
  const [data, setData] = useState<DashboardFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/admin/dashboard/feed", {
        cache: "no-store",
      });
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as DashboardFeed;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  return { data, error, loading, reload: load };
}
