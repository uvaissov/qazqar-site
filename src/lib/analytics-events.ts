"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    qazqarMetrikaId?: number;
  }
}

// Parameters must be non-personal: do not send phone, email, IIN, names or form text.
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  if (window.gtag) window.gtag("event", name, params);
  else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  }
  if (window.qazqarMetrikaId) window.ym?.(window.qazqarMetrikaId, "reachGoal", name, params);
}
