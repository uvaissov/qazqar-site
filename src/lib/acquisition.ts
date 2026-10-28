"use client";

export type Acquisition = { source: string; medium: string; campaign?: string; landingPath: string };
const STORAGE_KEY = "qazqar-acquisition";
const safe = (value: string | null) => (value || "").replace(/[^a-zA-Z0-9_. -]/g, "").slice(0, 100);

export function captureAcquisition(): Acquisition | undefined {
  if (typeof window === "undefined") return;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Acquisition;
    const url = new URL(window.location.href);
    const referrer = document.referrer ? new URL(document.referrer).hostname : "";
    const external = referrer && referrer !== url.hostname;
    const search = external && /(^|\.)(google\.[a-z.]+|yandex\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(referrer);
    const acquisition: Acquisition = {
      source: safe(url.searchParams.get("utm_source")) || (external ? referrer : "direct"),
      medium: safe(url.searchParams.get("utm_medium")) || (search ? "organic" : external ? "referral" : "none"),
      ...(safe(url.searchParams.get("utm_campaign")) && { campaign: safe(url.searchParams.get("utm_campaign")) }),
      landingPath: url.pathname.slice(0, 200),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(acquisition));
    return acquisition;
  } catch { return; }
}
