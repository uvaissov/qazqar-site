import { checkOtp } from "@/lib/otp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: "Email, code and type required" },
        { status: 400 }
      );
    }

    const valid = await checkOtp(email, code, type);

    if (!valid) {
      return NextResponse.json(
        { error: "INVALID_OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
