"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

/**
 * Живое обновление списка заявок в кабинете: слушает SSE
 * /api/cabinet/bookings/events и по `booking_changed` перерисовывает
 * серверный список (`router.refresh()`), не заставляя клиента жать F5.
 *
 * Куки уходят сами (same-origin). Переподключение делает EventSource
 * штатно; при уходе со страницы соединение закрываем.
 */
export default function BookingsLive() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/cabinet/bookings/events");
    const onChanged = () => router.refresh();
    source.addEventListener("booking_changed", onChanged);
    return () => {
      source.removeEventListener("booking_changed", onChanged);
      source.close();
    };
  }, [router]);

  return null;
}
