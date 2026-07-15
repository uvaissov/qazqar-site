import type { BookingStatus } from "@/generated/prisma/enums";

/**
 * Числовые статусы заявки в Yume CRM (поле `status` у /v1/crm/requests/
 * и `request_status` у /v1/crm/inventories/schedules/).
 *
 * ВАЖНО: раньше CRM отдавал строковые `status_color` / `request_status_color`
 * ("request", "reserve", "inrent", "exceed", "completed", "debtor", "cancelled").
 * Этих полей в API больше нет. Код, читавший их, получал undefined и молча
 * ронял все заявки в PENDING, а все авто — в "свободно".
 *
 * Значения выведены на выборке из 1000 заявок по фактам выдачи/возврата,
 * оплате и цепочке actions:
 *   0 — создана, авто не привязано        (0/1 выдано)
 *   1 — авто привязано, не выдано          (0/14 выдано)
 *   2 — выдана клиенту                     (28/28 выдано, 0 возвращено)
 *   3 — отменена                           (69/79 с is_cancellation в комментариях)
 *   4 — возвращена и оплачена              (785/785 возвращено, payment_status=1 у всех)
 *   5 — возвращена, есть долг              (93/93 возвращено, 92/93 недоплачено)
 *
 * Просрочка ("exceed") отдельным числом не приходит — это IN_RENT с прошедшим
 * rent_end, и вызывающий код определяет её по датам.
 */
export const CrmRequestStatus = {
  NEW: 0,
  RESERVED: 1,
  IN_RENT: 2,
  CANCELLED: 3,
  COMPLETED: 4,
  DEBTOR: 5,
} as const;

const CRM_TO_BOOKING: Record<number, BookingStatus> = {
  [CrmRequestStatus.NEW]: "PENDING",
  [CrmRequestStatus.RESERVED]: "CONFIRMED",
  [CrmRequestStatus.IN_RENT]: "ACTIVE",
  [CrmRequestStatus.CANCELLED]: "CANCELLED",
  // Обе терминальные аренды — завершённые для клиента; долг ведётся в CRM.
  [CrmRequestStatus.COMPLETED]: "COMPLETED",
  [CrmRequestStatus.DEBTOR]: "COMPLETED",
};

/**
 * Числовой статус CRM → локальный BookingStatus.
 *
 * Неизвестный или отсутствующий статус НЕ трогает данные — возвращается
 * `fallback` (текущий статус заявки). Это защита от повторения бага: любой
 * fallback на конкретный статус означает, что смена контракта в CRM молча
 * перепишет все заявки разом.
 */
export function mapCrmStatus<T>(
  crmStatus: number | null | undefined,
  fallback: T
): BookingStatus | T {
  if (typeof crmStatus === "number") {
    const mapped = CRM_TO_BOOKING[crmStatus];
    if (mapped) return mapped;
  }
  console.warn(
    `[Yume] неизвестный status=${JSON.stringify(crmStatus)} — статус не меняем (оставляем ${JSON.stringify(fallback)}). Проверь, не сменился ли контракт CRM.`
  );
  return fallback;
}
