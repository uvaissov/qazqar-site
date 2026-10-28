// Уведомления в Telegram о событиях по заявкам (bookings).
// Дублирует то, что админ видит на дашборде ("Требуют внимания"):
//   - новая заявка (PENDING)        → notifyNewBooking
//   - возврат авто на проверку (RETURN_PENDING) → notifyReturnPending
//
// Транспорт: Telegram Bot API, HTTP POST на sendMessage / editMessageText.
// Дизайн: fire-and-forget — отправка НЕ должна ломать создание/закрытие брони,
// поэтому все ошибки проглатываются и логируются, наружу не пробрасываются.
//
// Env:
//   TELEGRAM_BOT_TOKEN   — токен бота от @BotFather
//   TELEGRAM_CHAT_ID     — id чата/группы, куда слать (можно с минусом для групп)
//   TELEGRAM_TIMEOUT_MS  — таймаут запроса (default 8000)

import type { BookingSource, CrmSyncStatus } from "@/generated/prisma/enums";
import { BOOKING_SOURCE_LABELS } from "@/lib/booking-source";

export type TelegramResult = {
  ok: boolean;
  /** id отправленного сообщения — для последующей правки. */
  messageId?: number;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 8_000;

// Экранируем спецсимволы HTML, чтобы имена/комментарии не ломали parse_mode=HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Низкоуровневый вызов Bot API. Всегда резолвится (не throw), чтобы вызов можно
// было безопасно await-ить в hot-path создания брони.
async function callTelegram(
  method: "sendMessage" | "editMessageText",
  payload: Record<string, unknown>,
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const timeoutMs = Number(process.env.TELEGRAM_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!token || !chatId) {
    if (process.env.NODE_ENV === "production") {
      console.error("[telegram] TELEGRAM_BOT_TOKEN/CHAT_ID not set — skipping");
      return { ok: false, error: "TELEGRAM_NOT_CONFIGURED" };
    }
    console.warn(`[telegram] env not set, skipping ${method} (dev stub)`, payload);
    return { ok: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          ...payload,
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `HTTP_${res.status}: ${body.slice(0, 256)}`;
      console.error(`[telegram] ${method} failed:`, error);
      return { ok: false, error };
    }
    const json = (await res.json().catch(() => null)) as { result?: { message_id?: number } } | null;
    return { ok: true, messageId: json?.result?.message_id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] ${method} error:`, error);
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

export function sendTelegramMessage(text: string): Promise<TelegramResult> {
  return callTelegram("sendMessage", { text });
}

/** Правка ранее отправленного сообщения (message_id из sendTelegramMessage). */
export function editTelegramMessage(messageId: number, text: string): Promise<TelegramResult> {
  return callTelegram("editMessageText", { message_id: messageId, text });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTenge(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

// Ссылки. Локаль в URL обязательна (next-intl localePrefix=always) → префикс /ru.
const CRM_ORIGIN = process.env.YUME_ORIGIN?.trim() || "https://qazqar.yume.cloud";

// Строки со ссылками: (1) страница заявки/обработки в админке, (2) заявка в Yume CRM.
function linkLines(bookingId: string, requestId: number | null): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const lines: string[] = [];
  if (appUrl) {
    lines.push(`🔗 <a href="${appUrl}/ru/admin/bookings/${bookingId}">Заявка и обработка</a>`);
  }
  if (requestId != null) {
    lines.push(`🔗 <a href="${CRM_ORIGIN}/orders/${requestId}/all">Открыть в Yume CRM</a>`);
  }
  return lines;
}

// ── Сообщения по событиям ────────────────────────────────────────────────────

export type NewBookingNotice = {
  bookingId: string;
  requestId: number | null;
  customerName: string;
  customerPhone: string;
  carLabel: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  withDeposit: boolean;
  source: BookingSource;
  comment?: string | null;
  /** Состояние очереди отправки в Yume (src/lib/yume/crm-queue.ts). */
  crmSyncStatus?: CrmSyncStatus | null;
  crmSyncError?: string | null;
};

/** Заявка из БД (с машиной) → данные сообщения. Один маппер для создания и правок. */
export function newBookingNotice(b: {
  id: string; requestId: number | null; customerName: string; customerPhone: string;
  startDate: Date; endDate: Date; totalPrice: number; withDeposit: boolean;
  source: BookingSource; comment: string | null;
  crmSyncStatus: CrmSyncStatus | null; crmSyncError: string | null;
  car: { number: string | null; model: { name: string; brand: { name: string } } };
}): NewBookingNotice {
  return {
    bookingId: b.id, requestId: b.requestId,
    customerName: b.customerName, customerPhone: b.customerPhone,
    carLabel: `${b.car.model.brand.name} ${b.car.model.name} · ${b.car.number}`,
    startDate: b.startDate, endDate: b.endDate, totalPrice: b.totalPrice,
    withDeposit: b.withDeposit, source: b.source, comment: b.comment,
    crmSyncStatus: b.crmSyncStatus, crmSyncError: b.crmSyncError,
  };
}

const SOURCE_ICONS: Record<BookingSource, string> = { SITE: "🌐", MOBILE: "📱", CRM: "🗂" };

// Человекочитаемые причины FAILED (коды — из crm-queue.ts).
const CRM_ERROR_LABELS: Record<string, string> = {
  DATE_CONFLICT: "конфликт дат в CRM",
  CAR_NOT_LINKED: "авто не привязано к CRM",
  NO_USER: "у заявки нет аккаунта клиента",
};

function crmStatusLine(n: NewBookingNotice): string | null {
  switch (n.crmSyncStatus) {
    case "PENDING": return "⏳ Отправляется в Yume…";
    case "DONE": return n.requestId != null ? `✅ Создана в Yume #${n.requestId}` : null;
    case "FAILED": {
      const reason = (n.crmSyncError && CRM_ERROR_LABELS[n.crmSyncError]) || "ошибка CRM, попытки исчерпаны";
      return `⚠️ <b>Не ушла в Yume</b>: ${reason}`;
    }
    default: return null;
  }
}

function newBookingText(n: NewBookingNotice): string {
  const lines = [
    "🆕 <b>Новая заявка</b>",
    `${SOURCE_ICONS[n.source]} ${BOOKING_SOURCE_LABELS[n.source]}`,
    `🚗 ${escapeHtml(n.carLabel)}`,
    `👤 ${escapeHtml(n.customerName)}`,
    `📞 ${escapeHtml(n.customerPhone)}`,
    `📅 ${formatDate(n.startDate)} — ${formatDate(n.endDate)}`,
    `💰 ${formatTenge(n.totalPrice)}${n.withDeposit ? " · с депозитом" : " · без депозита"}`,
  ];
  if (n.comment) lines.push(`💬 ${escapeHtml(n.comment)}`);
  const crm = crmStatusLine(n);
  if (crm) lines.push(crm);
  lines.push(...linkLines(n.bookingId, n.requestId));
  return lines.join("\n");
}

export function notifyNewBooking(n: NewBookingNotice): Promise<TelegramResult> {
  return sendTelegramMessage(newBookingText(n));
}

/** Правит сообщение о заявке после обработки очереди (✅ / ⚠️ + ссылка на CRM). */
export function updateNewBookingNotice(messageId: number, n: NewBookingNotice): Promise<TelegramResult> {
  return editTelegramMessage(messageId, newBookingText(n));
}

export type ReturnPendingNotice = {
  bookingId: string;
  requestId: number | null;
  customerName: string;
  customerPhone: string;
  carLabel: string;
};

export function notifyReturnPending(n: ReturnPendingNotice): Promise<TelegramResult> {
  const lines = [
    "🔧 <b>Возврат авто — на проверку</b>",
    `🚗 ${escapeHtml(n.carLabel)}`,
    `👤 ${escapeHtml(n.customerName)}`,
    `📞 ${escapeHtml(n.customerPhone)}`,
  ];
  lines.push(...linkLines(n.bookingId, n.requestId));
  return sendTelegramMessage(lines.join("\n"));
}
