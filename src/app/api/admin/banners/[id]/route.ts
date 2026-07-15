import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const LOCALES = ["ru", "kz"];

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Обновляем только присланные поля: PATCH не должен затирать то, чего не
    // трогали. Пустая строка при этом осмысленна — это «стереть значение».
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};

    if (body.imageUrl !== undefined) {
      const imageUrl = nullable(body.imageUrl);
      if (!imageUrl) {
        return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
      }
      data.imageUrl = imageUrl;
    }
    if (body.linkUrl !== undefined) data.linkUrl = nullable(body.linkUrl);
    if (body.locale !== undefined) {
      const locale = nullable(body.locale);
      if (locale && !LOCALES.includes(locale)) {
        return NextResponse.json({ error: "BAD_LOCALE" }, { status: 400 });
      }
      data.locale = locale;
    }
    if (body.sortOrder !== undefined && Number.isInteger(body.sortOrder)) {
      data.sortOrder = body.sortOrder;
    }
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.startsAt !== undefined) data.startsAt = parseDate(body.startsAt);
    if (body.endsAt !== undefined) data.endsAt = parseDate(body.endsAt);

    // Период проверяем по итоговому состоянию, а не по присланному куску:
    // иначе можно было бы сдвинуть одну границу за другую двумя запросами.
    const current = await prisma.banner.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const startsAt = data.startsAt !== undefined ? data.startsAt : current.startsAt;
    const endsAt = data.endsAt !== undefined ? data.endsAt : current.endsAt;
    if (startsAt && endsAt && startsAt > endsAt) {
      return NextResponse.json({ error: "BAD_PERIOD" }, { status: 400 });
    }

    const banner = await prisma.banner.update({ where: { id }, data });
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Update banner error:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete banner error:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
