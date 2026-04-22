import { prisma } from "@/lib/prisma";
import { getSession, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { yumeApi } from "@/lib/yume/api";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { carId, customerName, customerPhone, customerEmail, customerIin, isResident, otpCode, startDate, endDate, comment, pickupAddressId, returnAddressId, withDeposit } = body;

    if (!carId || !customerName || !customerPhone || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get car and check availability
    const car = await prisma.car.findUnique({ where: { id: carId } });
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
        if (message.includes("конфликт") || message.includes("schedule")) {
          return NextResponse.json({ error: "DATE_CONFLICT" }, { status: 409 });
        }
        console.error("[Yume] Failed to create request in CRM:", err);
      }
    }

    // Create local booking
    const booking = await prisma.booking.create({
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
        const refreshToken = await signRefreshToken({ userId: user.id });
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
