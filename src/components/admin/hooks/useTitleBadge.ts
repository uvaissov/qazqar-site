"use client";

import { useEffect, useRef } from "react";

const BLINK_INTERVAL_MS = 1000;

/**
 * Always shows the total counts in the browser tab title.
 * When `hasAlert` is true, the title also blinks between the count form
 * and a bell-emoji form to grab attention.
 */
export function useTitleBadge(
  pendingTotal: number,
  returnTotal: number,
  hasAlert: boolean
) {
  const originalRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (originalRef.current === null) originalRef.current = document.title;

    const original = originalRef.current;
    const parts: string[] = [];
    if (pendingTotal > 0) parts.push(`${pendingTotal} новых`);
    if (returnTotal > 0) parts.push(`${returnTotal} возврат`);

    if (parts.length === 0) {
      document.title = original;
      return;
    }

    const badge = `(${parts.join(" · ")}) ${original}`;

    if (!hasAlert) {
      document.title = badge;
      return;
    }

    const alert = `🔔 ${parts.join(" · ")} — ${original}`;
    let showAlert = false;
    document.title = badge;
    const id = window.setInterval(() => {
      showAlert = !showAlert;
      document.title = showAlert ? alert : badge;
    }, BLINK_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
      document.title = badge;
    };
  }, [pendingTotal, returnTotal, hasAlert]);

  useEffect(() => {
    return () => {
      if (originalRef.current !== null) document.title = originalRef.current;
    };
  }, []);
}
