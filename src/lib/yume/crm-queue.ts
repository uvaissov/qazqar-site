import { prisma } from "@/lib/prisma";
import { exportBooking } from "@/lib/data/export-booking";
import { emitBookingChanged } from "@/lib/events/booking-events";
import { newBookingNotice, updateNewBookingNotice } from "@/lib/telegram/notify";
import type { CrmSyncStatus } from "@/generated/prisma/enums";
import { YumeApiError } from "./api";
import { resolveClient } from "./resolve-client";

/**
 * Очередь отправки заявок в Yume (docs/plans/2026-10-23-booking-crm-queue-design.md).
 *
 * POST /api/bookings создаёт только локальную заявку с crmSyncStatus = PENDING и
 * сразу отвечает: раньше синхронный поход в CRM занимал секунды, клиенты жали
 * кнопку повторно, и каждый параллельный запрос успевал создать заявку в Yume.
 *
 * Очередь — сами строки bookings: воркер тикает из startSync() и пинается после
 * создания заявки. От двойной отправки (тик + ручной повтор из админки) защищает
 * exportBooking: FOR UPDATE на строку брони и ранний выход при requestId.
 */

const TICK_INTERVAL = 15_000;
const BATCH = 10;
/** Паузы между попытками; после последней — FAILED. */
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 600_000];

/** Повтор не поможет — сразу FAILED, разбирается менеджер. */
const PERMANENT_ERRORS = new Set(["DATE_CONFLICT", "CAR_NOT_LINKED", "NO_USER", "INVALID_DATES"]);

const g = globalThis as typeof globalThis & {
  __crmQueueRunning?: boolean;
  __crmQueueTimer?: ReturnType<typeof setInterval>;
};

export function startCrmQueue() {
  if (g.__crmQueueTimer) return;
  g.__crmQueueTimer = setInterval(kickCrmQueue, TICK_INTERVAL);
  kickCrmQueue();
}

/** Fire-and-forget запуск обработки (после создания заявки и по таймеру). */
export function kickCrmQueue() {
  processCrmQueue().catch((err) => console.error("[CrmQueue] tick failed:", err));
}

export async function processCrmQueue() {
  if (g.__crmQueueRunning) return;
  g.__crmQueueRunning = true;
  try {
    // Крутим, пока есть готовые к отправке: заявка, созданная во время прохода,
    // не ждёт следующего тика.
    for (;;) {
      const due = await prisma.booking.findMany({
        where: {
          crmSyncStatus: "PENDING",
          OR: [{ crmSyncNextAt: null }, { crmSyncNextAt: { lte: new Date() } }],
        },
        orderBy: { createdAt: "asc" },
        take: BATCH,
        select: { id: true },
      });
      if (due.length === 0) return;
      for (const { id } of due) await syncBookingToCrm(id);
    }
  } finally {
    g.__crmQueueRunning = false;
  }
}

/** Код причины ошибки — уходит в crmSyncError, Telegram и админку. */
function errorCode(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if ((err instanceof YumeApiError && err.status === 409) || message.includes("конфликт") || message.includes("schedule")) {
    return "DATE_CONFLICT";
  }
  if (/^[A-Z_]+$/.test(message)) return message;
  return err instanceof YumeApiError ? `YUME_${err.status}` : "UNKNOWN";
}

/**
 * Отправляет одну заявку в Yume и пишет итог. Не бросает — результат в БД.
 * Возвращает итоговый статус (для ручного повтора из админки).
 */
export async function syncBookingToCrm(bookingId: string): Promise<CrmSyncStatus | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });
  if (!booking) return null;

  let clientId = booking.user?.clientId ?? null;
  try {
    let requestId = booking.requestId;
    if (!requestId) {
      if (!booking.user) throw new Error("NO_USER");
      const user = booking.user;
      if (!clientId) {
        // Аккаунты из быстрой регистрации и ранее не привязанные к CRM.
        const resolved = await resolveClient({
          name: `${user.lastName} ${user.firstName}`.trim(),
          email: user.email, phone: user.phone, iin: user.iin,
        });
        await prisma.user.updateMany({ where: { id: user.id, clientId: null }, data: { clientId: resolved } });
        clientId = (await prisma.user.findUnique({ where: { id: user.id }, select: { clientId: true } }))?.clientId ?? resolved;
      }
      requestId = await exportBooking(user.id, clientId, booking.id);
    }
    await finish(bookingId, { crmSyncStatus: "DONE", crmSyncError: null, crmSyncNextAt: null });
    emitBookingChanged({
      bookingId, requestId, userId: booking.userId,
      clientId, status: booking.status, prevStatus: booking.status,
    });
    return "DONE";
  } catch (err) {
    const code = errorCode(err);
    if (code === "BOOKING_NOT_ELIGIBLE") {
      // Заявку успели отменить/завершить локально — отправлять нечего.
      await prisma.booking.update({ where: { id: bookingId }, data: { crmSyncStatus: null, crmSyncNextAt: null } });
      return null;
    }
    const attempts = booking.crmSyncAttempts + 1;
    const failed = PERMANENT_ERRORS.has(code) || attempts >= BACKOFF_MS.length;
    console.error(`[CrmQueue] booking ${bookingId} attempt ${attempts} failed (${code}):`, err);
    if (failed) {
      await finish(bookingId, { crmSyncStatus: "FAILED", crmSyncError: code, crmSyncAttempts: attempts, crmSyncNextAt: null });
      return "FAILED";
    }
    await prisma.booking.update({
      where: { id: bookingId },
      data: { crmSyncError: code, crmSyncAttempts: attempts, crmSyncNextAt: new Date(Date.now() + BACKOFF_MS[attempts - 1]) },
    });
    return "PENDING";
  }
}

/** Итог очереди (DONE/FAILED) — в БД и правкой того же сообщения в Telegram. */
async function finish(
  bookingId: string,
  data: { crmSyncStatus: CrmSyncStatus; crmSyncError: string | null; crmSyncNextAt: null; crmSyncAttempts?: number },
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data,
    include: { car: { include: { model: { include: { brand: true } } } } },
  });
  if (booking.telegramMessageId) {
    await updateNewBookingNotice(booking.telegramMessageId, newBookingNotice(booking));
  }
}

/** Ручной повтор из админки: сбрасывает счётчик и отправляет сразу. */
export async function retryBookingCrmSync(bookingId: string): Promise<CrmSyncStatus | null> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { crmSyncStatus: "PENDING", crmSyncAttempts: 0, crmSyncError: null, crmSyncNextAt: null },
  });
  return syncBookingToCrm(bookingId);
}
