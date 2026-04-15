import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { checkOtp } from "@/lib/otp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code required" },
        { status: 400 }
      );
    }

    // Check OTP (don't consume — booking will consume it later if needed)
    const valid = await checkOtp(email, code, "LOGIN");
    if (!valid) {
      return NextResponse.json(
        { error: "INVALID_OTP" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });
    const refreshToken = await signRefreshToken({ userId: user.id });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("Login OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
