import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const intlMiddleware = createMiddleware(routing);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qazqar-secret-key-change-in-production"
);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || "ru";

  // Check if admin route (matches /ru/admin, /kz/admin, etc.)
  const isAdminRoute = /^\/(ru|kz)\/admin/.test(pathname);
  // Check if cabinet route (matches /ru/cabinet, /kz/cabinet, etc.)
  const isCabinetRoute = /^\/(ru|kz)\/cabinet/.test(pathname);

  if (isAdminRoute || isCabinetRoute) {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      // Admin routes require ADMIN role
      if (isAdminRoute && payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Run intl middleware for all matched routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
