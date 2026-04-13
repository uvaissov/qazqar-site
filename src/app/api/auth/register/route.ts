import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { validateIin } from "@/lib/iin";
import { yumeApi } from "@/lib/yume/api";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, phone, password, otpCode, iin, isResident } = await request.json();

    if (!firstName || !lastName || !email || !password || !otpCode) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const resident = isResident !== false;
    let crmClientId: number | null = null;

    if (resident && !iin) {
      return NextResponse.json(
        { error: "IIN_REQUIRED" },
        { status: 400 }
      );
    }

    // Validate IIN format and checksum
    if (iin) {
      const iinResult = validateIin(iin);
      if (!iinResult.valid) {
        return NextResponse.json(
          { error: iinResult.error },
          { status: 400 }
        );
      }

      // Check if IIN already used locally
      const iinExists = await prisma.user.findUnique({ where: { iin } });
      if (iinExists) {
        return NextResponse.json(
          { error: "IIN_EXISTS" },
          { status: 409 }
        );
      }
    }

    // Find or create client in Yume CRM: email → phone → IIN
    try {
      const byEmail = await yumeApi.searchClients(email);
      let crmClient = byEmail[0] || null;

      if (!crmClient && phone) {
        const byPhone = await yumeApi.findClientByPhone(phone);
        crmClient = byPhone;
      }

      if (!crmClient && iin) {
        const byIin = await yumeApi.searchClients(iin);
        crmClient = byIin[0] || null;
      }

      if (crmClient) {
        crmClientId = crmClient.id;
      } else {
        // Client not found — create in CRM
        const created = await yumeApi.createClient({
          name: `${lastName} ${firstName}`,
          email,
          ...(phone && { phone }),
          ...(iin && { iin }),
        });
        crmClientId = created.id;
      }
    } catch (err) {
      console.error("Yume CRM client lookup/create failed, skipping:", err);
    }

    // Verify OTP
    const otpValid = await verifyOtp(email, otpCode, "REGISTER");
    if (!otpValid) {
      return NextResponse.json(
        { error: "INVALID_OTP" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        iin: iin || null,
        isResident: resident,
        clientId: crmClientId,
        passwordHash,
        role: "CLIENT",
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
