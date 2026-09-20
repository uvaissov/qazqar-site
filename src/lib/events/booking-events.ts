import { EventEmitter } from "node:events";

/**
 * Внутрипроцессная шина событий по заявкам — источник для SSE в мобилку
 * (GET /api/cabinet/bookings/events).
 *
 * Почему не вебхуки CRM: у Yume их нет. /v1/notifications/ отдаёт только
 * transaction_* и request_time_exceed, смены статуса заявки там не бывает
 * (проверено на 800 уведомлениях за месяц, 16.09.2026). Единственный
 * источник правды о статусе — наш поллер syncActiveBookings (раз в минуту),
 * поэтому событие рождается здесь, в момент, когда поллер записал новый
 * статус в БД.
 *
 * Шина живёт в памяти одного процесса: прод — один контейнер Next.js, этого
 * достаточно. Если инстансов станет больше, сюда встанет Redis pub/sub, а
 * интерфейс останется.
 *
 * Держим на globalThis, как prisma: в dev Next.js перезагружает модули, и
 * без этого поллер и SSE-роут оказались бы на разных эмиттерах.
 */

export type BookingChangedEvent = {
  bookingId: string;
  requestId: number | null;
  /** Владелец заявки — фильтр для SSE-подписчика. */
  userId: string | null;
  /** CRM-клиент — второй фильтр: несколько аккаунтов могут смотреть одну заявку. */
  clientId: number | null;
  status: string;
  prevStatus: string | null;
  at: string;
};

const EVENT = "booking:changed";

type Bus = EventEmitter & { __bookingBus?: true };

const g = globalThis as typeof globalThis & { __bookingEventBus?: Bus };

function bus(): Bus {
  if (!g.__bookingEventBus) {
    const e = new EventEmitter() as Bus;
    // SSE-подписчиков может быть больше дефолтных 10 — иначе warning в логах.
    e.setMaxListeners(1000);
    g.__bookingEventBus = e;
  }
  return g.__bookingEventBus;
}

export function emitBookingChanged(event: Omit<BookingChangedEvent, "at">): void {
  bus().emit(EVENT, { ...event, at: new Date().toISOString() } satisfies BookingChangedEvent);
}

/** Подписка; возвращает функцию отписки. */
export function onBookingChanged(
  listener: (event: BookingChangedEvent) => void
): () => void {
  const b = bus();
  b.on(EVENT, listener);
  return () => b.off(EVENT, listener);
}
