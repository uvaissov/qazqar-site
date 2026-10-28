"use client";

import { useEffect } from "react";
import { captureAcquisition } from "@/lib/acquisition";
import { trackEvent } from "@/lib/analytics-events";

export default function ContactTracking({ metrikaId }: { metrikaId?: number }) {
  useEffect(() => {
    window.qazqarMetrikaId = metrikaId;
    captureAcquisition();
    const clicked = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      const params = { placement: target.getAttribute("data-placement") || "site" };
      if (href.startsWith("tel:")) trackEvent("phone_click", params);
      else if (/^https:\/\/(api\.whatsapp\.com|wa\.me)\//.test(href)) trackEvent("whatsapp_click", params);
      else if (href.includes("play.google.com/store") || href.includes("apps.apple.com")) trackEvent("app_download_click", params);
    };
    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, [metrikaId]);
  return null;
}
