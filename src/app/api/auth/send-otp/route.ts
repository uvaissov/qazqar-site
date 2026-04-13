import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email || !type || !["REGISTER", "RESET_PASSWORD", "LOGIN"].includes(type)) {
      return NextResponse.json(
        { error: "Email and valid type required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (type === "REGISTER" && existingUser) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    if ((type === "RESET_PASSWORD" || type === "LOGIN") && !existingUser) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const result = await createOtp(email, type);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    await sendOtpEmail(email, result.code, type);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
