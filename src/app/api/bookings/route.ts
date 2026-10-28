import { prisma } from "@/lib/prisma";
import { isCarPublic, BLOCKING_BOOKING_STATUSES } from "@/lib/data/cars";
import { getSession, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { YumeApiError } from "@/lib/yume/api";
import { resolveClient } from "@/lib/yume/resolve-client";
import { createCrmBooking } from "@/lib/yume/create-booking";
import { notifyNewBooking } from "@/lib/telegram/notify";
import { detectBookingSource, BOOKING_SOURCE_LABELS } from "@/lib/booking-source";
import { normalizePhone } from "@/lib/phone";
import { isQuoteError, quote } from "@/lib/pricing";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

/** Бросается внутри транзакции при пересечении дат с существующей бронью. */
class BookingConflictError extends Error {}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = detectBookingSource(request);
    const { carId, customerName, customerPhone: rawCustomerPhone, customerEmail, customerIin, isResident, otpCode, startDate, endDate, comment, pickupAddressId, returnAddressId, withDeposit } = body;

    if (!carId || !customerName || !rawCustomerPhone || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    // Send request to Yume CRM first — check for date conflicts
    let requestId: number | undefined;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    // В том числе аккаунты из быстрой регистрации и ранее не привязанные.
    if (user && !user.clientId) {
      try {
        const clientId = await resolveClient({
          name: `${user.lastName} ${user.firstName}`.trim(),
          email: user.email, phone: user.phone, iin: user.iin,
        });
        await prisma.user.updateMany({ where: { id: user.id, clientId: null }, data: { clientId } });
        user.clientId = (await prisma.user.findUnique({ where: { id: user.id }, select: { clientId: true } }))?.clientId ?? null;
      } catch (err) {
        console.error(`[Booking] ${user.id}: failed to link CRM client`, err);
      }
    }

    if (user?.clientId && car.inventoryId) {
      try {
        requestId = await createCrmBooking({
          clientId: user.clientId, inventoryId: car.inventoryId,
          startDate, endDate, pricePerDay: price.pricePerDay,
          comment: crmComment, depositAmount: withDeposit === false ? noDepositSurcharge : depositAmount,
          withDeposit: withDeposit !== false,
        });
      } catch (err) {
        const message = (err as Error).message || "";
        if ((err instanceof YumeApiError && err.status === 409) || message.includes("конфликт") || message.includes("schedule")) {
          return NextResponse.json({ error: "DATE_CONFLICT" }, { status: 409 });
        }
        console.error("[Yume] Failed to create request in CRM:", err);
      }
    }

    // Create local booking — в транзакции с advisory-блокировкой по авто,
    // чтобы два параллельных запроса не создали пересекающиеся брони (C4).
    // hashtext превращает cuid авто в int4-ключ для pg_advisory_xact_lock.
    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${carId}))`;

        const conflict = await tx.booking.findFirst({
          where: {
            carId,
            status: { in: [...BLOCKING_BOOKING_STATUSES] },
            startDate: { lt: end },
            endDate: { gt: start },
          },
        });
        if (conflict) throw new BookingConflictError();

        return tx.booking.create({
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
            requestId,
            pickupAddressId: pickupAddressId || null,
            returnAddressId: returnAddressId || null,
          },
        });
      });
    } catch (err) {
      if (err instanceof BookingConflictError) {
        return NextResponse.json({ error: "DATES_UNAVAILABLE" }, { status: 409 });
      }
      throw err;
    }

    // Уведомление в Telegram о новой заявке (fire-and-forget, ошибки проглатываются).
    await notifyNewBooking({
      bookingId: booking.id,
      requestId: requestId ?? null,
      customerName,
      customerPhone,
      carLabel: `${car.model.brand.name} ${car.model.name} · ${car.number}`,
      startDate: start,
      endDate: end,
      totalPrice: booking.totalPrice,
      withDeposit: booking.withDeposit,
      source,
      comment,
    });

    // Set auth cookie if user was created or verified via OTP
    const response = NextResponse.json({
      success: true,
      bookingId: booking.id,
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
