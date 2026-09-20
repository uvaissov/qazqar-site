import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onBookingChanged } from "@/lib/events/booking-events";
import { NextRequest } from "next/server";

// Долгоживущее соединение — никакого кэша и статической оптимизации.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Пинг чаще nginx proxy_read_timeout (120 с), иначе прокси рвёт поток. */
const HEARTBEAT_MS = 25_000;

/**
 * SSE-поток изменений статуса заявок текущего пользователя.
 *
 * Мобилка держит соединение, пока открыта, и по событию `booking_changed`
 * перечитывает список заказов. Источник событий — шина booking-events, куда
 * пишет поллер CRM. Авторизация — Bearer в заголовке (как у остальных
 * /api/cabinet/*), фильтр — по userId ИЛИ clientId (несколько аккаунтов
 * одного CRM-клиента видят одни заявки).
 *
 * Формат: `event: booking_changed` + `data: {bookingId, status, prevStatus}`;
 * комментарии `: ping` — heartbeat.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { clientId: true },
  });
  const userId = session.userId;
  const clientId = user?.clientId ?? null;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // поток уже закрыт клиентом
        }
      };

      // Первое сообщение сразу: клиент понимает, что подключился, а прокси
      // начинает отдавать байты (не ждёт первого события).
      send(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

      unsubscribe = onBookingChanged((event) => {
        const mine =
          (event.userId != null && event.userId === userId) ||
          (clientId != null && event.clientId === clientId);
        if (!mine) return;
        send(
          `event: booking_changed\ndata: ${JSON.stringify({
            bookingId: event.bookingId,
            requestId: event.requestId,
            status: event.status,
            prevStatus: event.prevStatus,
            at: event.at,
          })}\n\n`
        );
      });

      heartbeat = setInterval(() => send(`: ping\n\n`), HEARTBEAT_MS);

      const close = () => {
        unsubscribe?.();
        unsubscribe = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        try {
          controller.close();
        } catch {
          // уже закрыт
        }
      };
      request.signal.addEventListener("abort", close);
    },
    cancel() {
      unsubscribe?.();
      unsubscribe = null;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // nginx: не буферизовать ответ, отдавать события сразу.
      "X-Accel-Buffering": "no",
    },
  });
}
