import { prisma } from "@/lib/prisma";
import { yumeApi } from "@/lib/yume/api";
import { CrmRequestStatus } from "@/lib/yume/booking-status";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/data/cars";

/**
 * Подбор машин на замену в заявке.
 *
 * Каталог показывает одну карточку на группу (модель + год + цвет + цена,
 * см. getGroupedCars), и в заявку попадает случайная машина из группы.
 * Клиент может поменять её на другую **из той же группы** — тогда цена,
 * скидка и депозит не меняются, меняется только госномер.
 *
 * Свободность проверяем в двух источниках, потому что локальная БД знает
 * только заявки с сайта/мобилки, а CRM — ещё и брони, заведённые менеджером
 * вручную:
 *   1. локальные bookings с блокирующими статусами;
 *   2. расписание CRM (/v1/crm/inventories/schedules/) на даты заявки.
 * Если CRM недоступна — остаёмся на локальной проверке; финальный арбитр
 * всё равно CRM при bulk_update.
 */

export type AlternativeCar = {
  id: string;
  inventoryId: number;
  number: string;
  color: string;
  year: number;
  image: string | null;
};

type BookingForAlternatives = {
  carId: string;
  startDate: Date;
  endDate: Date;
  car: { modelId: string; year: number; color: string; pricePerDay: number };
};

const toDateOnly = (d: Date) => d.toISOString().split("T")[0];

/** inventoryId → занято ли авто в CRM на [start, end). */
async function getCrmBusyInventories(start: Date, end: Date): Promise<Set<number> | null> {
  try {
    const inventories = await yumeApi.getAllSchedules(toDateOnly(start), toDateOnly(end));
    const busy = new Set<number>();
    for (const inv of inventories) {
      const overlaps = inv.schedules.some((s) => {
        const blocking =
          s.request_status === CrmRequestStatus.RESERVED ||
          s.request_status === CrmRequestStatus.IN_RENT ||
          s.request_status === CrmRequestStatus.EXCEED;
        return blocking && new Date(s.start_at) < end && new Date(s.end_at) > start;
      });
      if (overlaps) busy.add(inv.id);
    }
    return busy;
  } catch (err) {
    console.error("[Alternatives] CRM schedules unavailable, local check only:", err);
    return null;
  }
}

export async function getAlternativeCars(booking: BookingForAlternatives): Promise<AlternativeCar[]> {
  const { car, startDate, endDate } = booking;

  const [candidates, crmBusy] = await Promise.all([
    prisma.car.findMany({
      where: {
        id: { not: booking.carId },
        modelId: car.modelId,
        year: car.year,
        color: car.color,
        pricePerDay: car.pricePerDay,
        isArchived: false,
        bookings: {
          none: {
            status: { in: [...BLOCKING_BOOKING_STATUSES] },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        },
      },
      include: {
        photos: { include: { photo: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { number: "asc" },
    }),
    getCrmBusyInventories(startDate, endDate),
  ]);

  return candidates
    .filter((c) => !crmBusy?.has(c.inventoryId))
    .map((c) => ({
      id: c.id,
      inventoryId: c.inventoryId,
      number: c.number,
      color: c.color,
      year: c.year,
      image: c.photos[0]?.photo.url ?? null,
    }));
}
