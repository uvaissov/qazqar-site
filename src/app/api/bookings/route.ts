import { prisma } from "@/lib/prisma";
import { isCarPublic, BLOCKING_BOOKING_STATUSES } from "@/lib/data/cars";
import { getSession, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { kickCrmQueue } from "@/lib/yume/crm-queue";
import { newBookingNotice, notifyNewBooking } from "@/lib/telegram/notify";
import { detectBookingSource, BOOKING_SOURCE_LABELS } from "@/lib/booking-source";
import { normalizePhone } from "@/lib/phone";
import { isQuoteError, quote } from "@/lib/pricing";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

/** Бросается внутри транзакции при пересечении дат с существующей бронью. */
class BookingConflictError extends Error {}

/** Пауза очереди на время отправки в Telegram (таймаут Telegram — 8 с). */
const CRM_QUEUE_HOLD_MS = 30_000;

/** Ключ идемпотентности от клиента: UUID или похожий токен. */
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9-]{8,64}$/;

/** Повтор запроса с тем же ключом — отдаём уже созданную заявку. */
function replayResponse(existing: { id: string; carId: string }, carId: string) {
  if (existing.carId !== carId) {
    return NextResponse.json({ error: "IDEMPOTENCY_KEY_REUSED" }, { status: 409 });
  }
  return NextResponse.json({ success: true, bookingId: existing.id, newUser: false });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = detectBookingSource(request);
    const { carId, customerName, customerPhone: rawCustomerPhone, customerEmail, customerIin, isResident, otpCode, startDate, endDate, comment, pickupAddressId, returnAddressId, withDeposit, idempotencyKey: rawIdempotencyKey } = body;

    if (!carId || !customerName || !rawCustomerPhone || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ключ необязателен (старые сборки мобилки его не шлют), но если пришёл — валиден.
    if (rawIdempotencyKey != null && (typeof rawIdempotencyKey !== "string" || !IDEMPOTENCY_KEY_RE.test(rawIdempotencyKey))) {
      return NextResponse.json({ error: "INVALID_IDEMPOTENCY_KEY" }, { status: 400 });
    }
    const idempotencyKey: string | null = rawIdempotencyKey ?? null;

    // Повтор (двойной клик, ретрай сети) — до OTP: код одноразовый, повтор
    // упал бы на INVALID_OTP, хотя заявка уже создана.
    if (idempotencyKey) {
      const existing = await prisma.booking.findUnique({ where: { idempotencyKey }, select: { id: true, carId: true } });
      if (existing) return replayResponse(existing, carId);
    }

    // Дальше по коду телефон ищет юзера через findUnique — по сырой строке гость
    // с «8705…» не находил свой аккаунт с «+7705…» и заводил дубль.
    const phoneResult = normalizePhone(rawCustomerPhone, {
      resident: isResident !== false,
    });
    if (!phoneResult.ok) {
      return NextResponse.json({ error: phoneResult.error }, { status: 400 });
    }
    const customerPhone = phoneResult.phone;

    // Get car and check availability
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { model: { include: { brand: true } }, tariff: { include: { tiers: true } } },
    });
    if (!car || !isCarPublic(car)) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 400 }
      );
    }

    // Dates come as "YYYY-MM-DD HH:MM" from form
    // Parse with Astana timezone to avoid shifts
    const startISO = startDate.replace(" ", "T") + ":00+05:00";
    const endISO = endDate.replace(" ", "T") + ":00+05:00";
    const start = new Date(startISO);
    const end = new Date(endISO);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    // Дата начала не должна быть в прошлом (как в catalog/[id]/price)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    // Цена по тарифной сетке машины; срок длиннее сетки и машина без
    // тарифа — отказ (docs/plans/2026-09-20-tariff-grid-design.md).
    const price = await quote(car, start, end);
    if (isQuoteError(price)) {
      return NextResponse.json(price, { status: 400 });
    }

    // Determine user: existing session or quick registration
    let userId: string | undefined;
    let newUser = false;
    const session = await getSession();

    if (session) {
      // Verify user actually exists in DB (session token may be stale)
      const sessionUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (sessionUser) userId = session.userId;
    } else if (customerEmail && otpCode) {
      // Verify OTP before creating user
      const otpValid = await verifyOtp(customerEmail, otpCode, "REGISTER")
        || await verifyOtp(customerEmail, otpCode, "RESET_PASSWORD");
      if (!otpValid) {
        return NextResponse.json({ error: "INVALID_OTP" }, { status: 400 });
      }

      // Find existing user by email or phone, or create new
      let user = await prisma.user.findUnique({ where: { email: customerEmail } });

      if (!user && customerPhone) {
        user = await prisma.user.findUnique({ where: { phone: customerPhone } });
      }

      if (!user) {
        const tempPassword = await hash(Math.random().toString(36), 10);
        const [firstName, ...lastParts] = customerName.split(" ");

        // Check if phone already taken
        const phoneExists = customerPhone
          ? await prisma.user.findUnique({ where: { phone: customerPhone } })
          : null;

        user = await prisma.user.create({
          data: {
            email: customerEmail,
            phone: phoneExists ? null : (customerPhone || null),
            iin: customerIin || null,
            isResident: isResident !== false,
            firstName: firstName || customerName,
            lastName: lastParts.join(" ") || "",
            passwordHash: tempPassword,
            role: "CLIENT",
          },
        });
        newUser = true;
      }

      userId = user.id;
    }

    // Resolve address names for CRM comment
    let pickupAddressName: string | null = null;
    let returnAddressName: string | null = null;
    if (pickupAddressId) {
      const addr = await prisma.address.findUnique({ where: { id: pickupAddressId }, select: { name: true } });
      pickupAddressName = addr?.name ?? null;
    }
    if (returnAddressId) {
      const addr = await prisma.address.findUnique({ where: { id: returnAddressId }, select: { name: true } });
      returnAddressName = addr?.name ?? null;
    }

    // Build CRM comment: источник заявки + адреса
    const crmCommentParts: string[] = [`Источник: ${BOOKING_SOURCE_LABELS[source]}`];
    // Bounded acquisition labels only; no referrer query strings or client identifiers.
    if (source === "SITE" && body.attribution && typeof body.attribution === "object") {
      const value = (key: string) => typeof body.attribution[key] === "string"
        ? body.attribution[key].replace(/[^a-zA-Z0-9_. /-]/g, "").slice(0, key === "landingPath" ? 200 : 100) : "";
      const acquisition = [value("source"), value("medium"), value("campaign")].filter(Boolean).join(" / ");
      if (acquisition) crmCommentParts.push(`Канал привлечения: ${acquisition}`);
      if (value("landingPath")) crmCommentParts.push(`Страница входа: ${value("landingPath")}`);
    }
    if (pickupAddressName) crmCommentParts.push(`Адрес подачи: ${pickupAddressName}`);
    if (returnAddressName) crmCommentParts.push(`Адрес возврата: ${returnAddressName}`);

    // Депозит и надбавка «без депозита» — из того же расчёта, что и витрина
    const depositAmount = price.deposit;
    const noDepositSurcharge = withDeposit === false ? price.withoutDeposit : 0;
    if (withDeposit === false && depositAmount > 0) {
      crmCommentParts.push(`Без депозита: надбавка ${noDepositSurcharge.toLocaleString()} ₸`);
    } else if (depositAmount > 0) {
      crmCommentParts.push(`С депозитом: ${depositAmount.toLocaleString()} ₸`);
    }

    if (comment) crmCommentParts.push(comment);
    const crmComment = crmCommentParts.join("\n") || null;

    // Create local booking — в транзакции с advisory-блокировкой по авто,
    // чтобы два параллельных запроса не создали пересекающиеся брони (C4).
    // hashtext превращает cuid авто в int4-ключ для pg_advisory_xact_lock.
    // В Yume заявка уходит потом, через очередь (src/lib/yume/crm-queue.ts).
    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${carId}))`;

        // Параллельный дубль с тем же ключом ждал блокировку — отдаём созданную.
        if (idempotencyKey) {
          const existing = await tx.booking.findUnique({ where: { idempotencyKey }, select: { id: true, carId: true } });
          if (existing) return { replay: existing, created: null };
        }

        const conflict = await tx.booking.findFirst({
          where: {
            carId,
            status: { in: [...BLOCKING_BOOKING_STATUSES] },
            startDate: { lt: end },
            endDate: { gt: start },
          },
        });
        if (conflict) throw new BookingConflictError();

        return { replay: null, created: await tx.booking.create({
          data: {
            carId,
            customerName,
            customerPhone,
            startDate: start,
            endDate: end,
            totalPrice: price.totalPrice,
            discountPercent: 0,
            withDeposit: withDeposit !== false,
            depositAmount: withDeposit === false ? noDepositSurcharge : depositAmount,
            depositLabel: depositAmount > 0
              ? (withDeposit === false ? `Без депозита (надбавка ${noDepositSurcharge.toLocaleString()} ₸)` : `Депозит ${depositAmount.toLocaleString()} ₸`)
              : null,
            status: "PENDING",
            source,
            comment: comment || null,
            userId,
            idempotencyKey,
            crmSyncStatus: "PENDING",
            // Придерживаем от тика очереди, пока не сохранён telegramMessageId,
            // иначе «создана в Yume» некуда будет дописать.
            crmSyncNextAt: new Date(Date.now() + CRM_QUEUE_HOLD_MS),
            crmComment,
            pickupAddressId: pickupAddressId || null,
            returnAddressId: returnAddressId || null,
          },
          include: { car: { include: { model: { include: { brand: true } } } } },
        }) };
      });
    } catch (err) {
      if (err instanceof BookingConflictError) {
        return NextResponse.json({ error: "DATES_UNAVAILABLE" }, { status: 409 });
      }
      // Тот же ключ на другую машину: блокировки разные, ловит unique-индекс.
      if (idempotencyKey && (err as { code?: string }).code === "P2002") {
        const existing = await prisma.booking.findUnique({ where: { idempotencyKey }, select: { id: true, carId: true } });
        if (existing) return replayResponse(existing, carId);
      }
      throw err;
    }

    if (booking.replay) return replayResponse(booking.replay, carId);
    const created = booking.created;

    // Уведомление в Telegram (ошибки проглатываются). message_id сохраняем —
    // очередь допишет в это же сообщение «создана в Yume» со ссылкой.
    const tg = await notifyNewBooking(newBookingNotice(created));
    await prisma.booking.update({
      where: { id: created.id },
      data: { telegramMessageId: tg.messageId ?? null, crmSyncNextAt: null },
    });
    kickCrmQueue();

    // Set auth cookie if user was created or verified via OTP
    const response = NextResponse.json({
      success: true,
      bookingId: created.id,
      newUser,
    });

    if (userId && !session) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const accessToken = await signAccessToken({
          userId: user.id,
          email: user.email!,
          role: user.role,
        });
        const refreshToken = await signRefreshToken({
          userId: user.id,
          email: user.email!,
          role: user.role,
        });
        setAuthCookies(response, accessToken, refreshToken);
      }
    }

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Booking error:", msg, error);
    return NextResponse.json(
      { error: "Internal server error", detail: msg },
      { status: 500 }
    );
  }
}
