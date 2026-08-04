import { prisma } from "@/lib/prisma";
import { getSession, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { yumeApi, YumeApiError } from "@/lib/yume/api";
import { BookingStatus } from "@/generated/prisma/enums";
import { notifyNewBooking } from "@/lib/telegram/notify";
import { normalizePhone } from "@/lib/phone";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

/** Бросается внутри транзакции при пересечении дат с существующей бронью. */
class BookingConflictError extends Error {}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      include: { model: { include: { brand: true } } },
    });
    if (!car) {
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

    // Find applicable discount
    const discount = await prisma.discount.findFirst({
      where: { active: true, minDays: { lte: days }, maxDays: { gte: days } },
    });
    const discountPercent = discount?.percent ?? 0;

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

    // Build CRM comment with addresses
    const crmCommentParts: string[] = [];
    if (pickupAddressName) crmCommentParts.push(`Адрес подачи: ${pickupAddressName}`);
    if (returnAddressName) crmCommentParts.push(`Адрес возврата: ${returnAddressName}`);

    // Deposit info
    const depositAmount = car.deposit ?? 0;
    let noDepositSurcharge = 0;
    if (withDeposit === false && depositAmount > 0) {
      // Calculate no-deposit surcharge
      const surcharge = await prisma.noDepositSurcharge.findFirst({
        where: { minDay: { lte: days }, maxDay: { gte: days } },
      });
      if (surcharge) {
        const settingVat = await prisma.appSetting.findUnique({ where: { key: "vatPercent" } });
        const vat = Number(settingVat?.value) || 0;
        noDepositSurcharge = Math.round(depositAmount * surcharge.percent / 100 * (1 + vat / 100));
      } else {
        // Overflow
        const lastSurcharge = await prisma.noDepositSurcharge.findFirst({ orderBy: { maxDay: "desc" } });
        const settingStep = await prisma.appSetting.findUnique({ where: { key: "overflowDailyPercent" } });
        const settingVat = await prisma.appSetting.findUnique({ where: { key: "vatPercent" } });
        const lastPercent = lastSurcharge?.percent ?? 0;
        const lastDay = lastSurcharge?.maxDay ?? 0;
        const step = Number(settingStep?.value) || 0;
        const vat = Number(settingVat?.value) || 0;
        const percent = lastPercent + step * Math.max(0, days - lastDay);
        noDepositSurcharge = Math.round(depositAmount * percent / 100 * (1 + vat / 100));
      }
      crmCommentParts.push(`Без депозита: надбавка ${noDepositSurcharge.toLocaleString()} ₸`);
    } else if (depositAmount > 0) {
      crmCommentParts.push(`С депозитом: ${depositAmount.toLocaleString()} ₸`);
    }

    if (comment) crmCommentParts.push(comment);
    const crmComment = crmCommentParts.join("\n") || null;

    // Send request to Yume CRM first — check for date conflicts
    let requestId: number | undefined;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    if (user?.clientId && car.inventoryId) {
      // startDate/endDate already in "YYYY-MM-DD HH:MM" format from form
      const crmStart = startDate;
      const crmEnd = endDate;

      try {
        const yumeRequest = await yumeApi.createRequest({
          client: user.clientId,
          rent_start: crmStart,
          rent_end: crmEnd,
        });

        await yumeApi.attachInventory(yumeRequest.id, {
          inventory: car.inventoryId,
          tarif_price: car.pricePerDay,
          start_at: crmStart,
          end_at: crmEnd,
        });

        await yumeApi.saveRequest(yumeRequest.id, {
          rent_start: crmStart,
          rent_end: crmEnd,
        });

        // Add address info as comment to CRM request
        if (crmComment) {
          await yumeApi.addRequestComment(yumeRequest.id, crmComment);
        }

        // Add deposit / no-deposit surcharge as service to CRM request
        if (depositAmount > 0) {
          try {
            const isNoDeposit = withDeposit === false;
            await yumeApi.addRequestService({
              request: yumeRequest.id,
              service: isNoDeposit ? 5 : 15,
              tarif_price: (isNoDeposit ? noDepositSurcharge : depositAmount).toString(),
              start_at: crmStart,
              end_at: crmEnd,
            });
          } catch (depositErr) {
            console.error("[Yume] Failed to add deposit service:", depositErr);
          }
        }

        requestId = yumeRequest.id;
      } catch (err) {
        const message = (err as Error).message || "";
        // Конфликт расписания: основной сигнал — HTTP 409 от CRM;
        // текстовая подстрока оставлена как fallback для иных кодов.
        const isConflict =
          (err instanceof YumeApiError && err.status === 409) ||
          message.includes("конфликт") ||
          message.includes("schedule");
        if (isConflict) {
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
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
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
            totalPrice: Math.round(days * car.pricePerDay * (1 - discountPercent / 100)),
            discountPercent,
            withDeposit: withDeposit !== false,
            depositAmount: withDeposit === false ? noDepositSurcharge : depositAmount,
            depositLabel: depositAmount > 0
              ? (withDeposit === false ? `Без депозита (надбавка ${noDepositSurcharge.toLocaleString()} ₸)` : `Депозит ${depositAmount.toLocaleString()} ₸`)
              : null,
            status: "PENDING",
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
