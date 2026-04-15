import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qazqar-secret-key-change-in-production"
);

export const ACCESS_MAX_AGE = 60 * 60 * 24; // 1 day
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshPayload {
  userId: string;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: RefreshPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("180d")
    .sign(JWT_SECRET);
}

/** @deprecated Use signAccessToken instead */
export const signToken = signAccessToken;

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as RefreshPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  // Try cookie first (web clients)
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth-token")?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  // Fallback to Authorization header (mobile clients)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7);
    return verifyToken(bearerToken);
  }

  return null;
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set("auth-token", accessToken, {
    ...cookieBase,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set("refresh-token", refreshToken, {
    ...cookieBase,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("auth-token", "", { ...cookieBase, maxAge: 0 });
  response.cookies.set("refresh-token", "", { ...cookieBase, maxAge: 0 });
}
