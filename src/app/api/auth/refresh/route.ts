import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  setAuthCookies,
  signRefreshToken,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Try cookie first (web clients), then request body (mobile clients)
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get("refresh-token")?.value;

    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch {
        // No body or invalid JSON — ignore
      }
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });
    const newRefreshToken = await signRefreshToken({ userId: user.id });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
