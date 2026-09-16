import type { BookingSource } from "@/generated/prisma/enums";

/**
 * Откуда пришла заявка — определяем на бэке по запросу, а не по полю в теле:
 * клиент не должен диктовать источник.
 *
 * Приоритет:
 *  1. явный заголовок `X-Client-Platform` (мобилка шлёт `mobile`, см.
 *     qazqar_flutter/lib/service/core/api-service.dart);
 *  2. User-Agent: Dart-клиент (`Dart/3.x (dart:io)`) — это старые версии
 *     приложения без заголовка; браузер → сайт.
 */
export function detectBookingSource(request: Request): BookingSource {
  const explicit = request.headers.get("x-client-platform")?.trim().toLowerCase();
  if (explicit === "mobile" || explicit === "android" || explicit === "ios") return "MOBILE";
  if (explicit === "web" || explicit === "site") return "SITE";

  const ua = request.headers.get("user-agent") ?? "";
  if (/^Dart\//i.test(ua) || /\bFlutter\b/i.test(ua)) return "MOBILE";
  return "SITE";
}

/** Человекочитаемое название источника — для комментария в CRM и Telegram. */
export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  SITE: "Сайт",
  MOBILE: "Мобильное приложение",
  CRM: "CRM",
};
