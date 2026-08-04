// Уведомления в Telegram о событиях по заявкам (bookings).
// Дублирует то, что админ видит на дашборде ("Требуют внимания"):
//   - новая заявка (PENDING)        → notifyNewBooking
//   - возврат авто на проверку (RETURN_PENDING) → notifyReturnPending
//
// Транспорт: Telegram Bot API, HTTP POST на sendMessage.
// Дизайн: fire-and-forget — отправка НЕ должна ломать создание/закрытие брони,
// поэтому все ошибки проглатываются и логируются, наружу не пробрасываются.
//
// Env:
//   TELEGRAM_BOT_TOKEN   — токен бота от @BotFather
//   TELEGRAM_CHAT_ID     — id чата/группы, куда слать (можно с минусом для групп)
//   TELEGRAM_TIMEOUT_MS  — таймаут запроса (default 8000)

export type TelegramResult = {
  ok: boolean;
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

// Низкоуровневая отправка. Всегда резолвится (не throw), чтобы вызов можно было
// безопасно await-ить в hot-path создания брони.
export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const timeoutMs = Number(process.env.TELEGRAM_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!token || !chatId) {
    if (process.env.NODE_ENV === "production") {
      console.error("[telegram] TELEGRAM_BOT_TOKEN/CHAT_ID not set — skipping");
      return { ok: false, error: "TELEGRAM_NOT_CONFIGURED" };
    }
    console.warn("[telegram] env not set, skipping (dev stub)", { text });
    return { ok: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `HTTP_${res.status}: ${body.slice(0, 256)}`;
      console.error("[telegram] sendMessage failed:", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[telegram] sendMessage error:", error);
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
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
  comment?: string | null;
};

export function notifyNewBooking(n: NewBookingNotice): Promise<TelegramResult> {
  const lines = [
    "🆕 <b>Новая заявка</b>",
    `🚗 ${escapeHtml(n.carLabel)}`,
    `👤 ${escapeHtml(n.customerName)}`,
    `📞 ${escapeHtml(n.customerPhone)}`,
    `📅 ${formatDate(n.startDate)} — ${formatDate(n.endDate)}`,
    `💰 ${formatTenge(n.totalPrice)}${n.withDeposit ? " · с депозитом" : " · без депозита"}`,
  ];
  if (n.comment) lines.push(`💬 ${escapeHtml(n.comment)}`);
  lines.push(...linkLines(n.bookingId, n.requestId));
  return sendTelegramMessage(lines.join("\n"));
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
