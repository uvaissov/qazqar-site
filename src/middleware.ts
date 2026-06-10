import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const intlMiddleware = createMiddleware(routing);

const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error("JWT_SECRET env variable is required");
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

const ACCESS_MAX_AGE = 60 * 60 * 24; // 1 day

async function tryRefreshAccess(
  request: NextRequest
): Promise<{ payload: Record<string, unknown>; newAccessToken: string } | null> {
  const refreshToken = request.cookies.get("refresh-token")?.value;
  if (!refreshToken) return null;

  try {
    // Роль и email берём ИЗ верифицированного refresh-токена, а не из
    // неверифицированного access-токена — иначе CLIENT мог бы подделать
    // access-cookie с role: "ADMIN" и получить перевыпуск админ-токена.
    const { payload: refreshPayload } = await jwtVerify(refreshToken, JWT_SECRET);
    if (refreshPayload.typ !== "refresh") return null;

    const userId = refreshPayload.userId as string | undefined;
    const email = refreshPayload.email as string | undefined;
    const role = refreshPayload.role as string | undefined;
    if (!userId || !role) return null;

    const newPayload = { userId, email, role, typ: "access" };
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
        // refresh-токен, подставленный в auth-cookie, не должен работать как access
        if (result.payload.typ !== "access") throw new Error("not an access token");
        payload = result.payload as Record<string, unknown>;
      } catch {
        // Access token expired (or wrong typ) — try refresh
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
