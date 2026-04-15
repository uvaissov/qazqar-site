import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const intlMiddleware = createMiddleware(routing);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qazqar-secret-key-change-in-production"
);

const ACCESS_MAX_AGE = 60 * 60 * 24; // 1 day

async function tryRefreshAccess(
  request: NextRequest
): Promise<{ payload: Record<string, unknown>; newAccessToken: string } | null> {
  const refreshToken = request.cookies.get("refresh-token")?.value;
  if (!refreshToken) return null;

  try {
    const { payload: refreshPayload } = await jwtVerify(refreshToken, JWT_SECRET);
    const userId = refreshPayload.userId as string;
    if (!userId) return null;

    // Fetch user from DB via internal API is not possible in middleware,
    // so we decode the expired access token to get email/role without verification
    const accessToken = request.cookies.get("auth-token")?.value;
    if (!accessToken) return null;

    // Decode without verification to extract claims from expired token
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    if (claims.userId !== userId) return null;

    const newPayload = { userId, email: claims.email, role: claims.role };
    const newAccessToken = await new SignJWT(newPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    return { payload: newPayload, newAccessToken };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || "ru";

  const isAdminRoute = /^\/(ru|kz)\/admin/.test(pathname);
  const isCabinetRoute = /^\/(ru|kz)\/cabinet/.test(pathname);

  if (isAdminRoute || isCabinetRoute) {
    const accessToken = request.cookies.get("auth-token")?.value;
    let payload: Record<string, unknown> | null = null;
    let newAccessToken: string | null = null;

    if (accessToken) {
      try {
        const result = await jwtVerify(accessToken, JWT_SECRET);
        payload = result.payload as Record<string, unknown>;
      } catch {
        // Access token expired — try refresh
        const refreshed = await tryRefreshAccess(request);
        if (refreshed) {
          payload = refreshed.payload;
          newAccessToken = refreshed.newAccessToken;
        }
      }
    } else {
      // No access token — try refresh
      const refreshed = await tryRefreshAccess(request);
      if (refreshed) {
        payload = refreshed.payload;
        newAccessToken = refreshed.newAccessToken;
      }
    }

    if (!payload) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // If access token was refreshed, set new cookie
    if (newAccessToken) {
      const response = intlMiddleware(request);
      response.cookies.set("auth-token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ACCESS_MAX_AGE,
        path: "/",
      });
      return response;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
