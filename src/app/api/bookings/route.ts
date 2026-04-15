import { prisma } from "@/lib/prisma";
import { getSession, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { yumeApi } from "@/lib/yume/api";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { carId, customerName, customerPhone, customerEmail, customerIin, isResident, otpCode, startDate, endDate, comment } = body;

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
      userId = session.userId;
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
        totalPrice: days * car.pricePerDay * (1 - discountPercent / 100),
        discountPercent,
        status: "PENDING",
        comment: comment || null,
        userId,
        requestId,
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
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
