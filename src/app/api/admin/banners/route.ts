import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const LOCALES = ["ru", "kz"];

/** Пустую строку из формы приводим к null: "" — это «не задано», а не значение. */
function nullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseDate(value: unknown): Date | null {
  const raw = nullable(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Get banners error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const imageUrl = nullable(body.imageUrl);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "IMAGE_REQUIRED" },
        { status: 400 }
      );
    }

    const locale = nullable(body.locale);
    if (locale && !LOCALES.includes(locale)) {
      return NextResponse.json({ error: "BAD_LOCALE" }, { status: 400 });
    }

    const startsAt = parseDate(body.startsAt);
    const endsAt = parseDate(body.endsAt);
    if (startsAt && endsAt && startsAt > endsAt) {
      return NextResponse.json({ error: "BAD_PERIOD" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        linkUrl: nullable(body.linkUrl),
        locale,
        sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
        active: body.active !== false,
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
