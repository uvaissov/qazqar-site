import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Баннеры карусели для мобильного приложения.
 *
 * Отдаём только то, что реально должно показываться прямо сейчас: включённые,
 * попадающие в период показа и подходящие по языку. Фильтровать на клиенте
 * нельзя — тогда выключенный или просроченный баннер уехал бы в приложение и
 * зависел от того, обновит ли пользователь версию.
 *
 * ?locale=ru|kz — вернуть баннеры этого языка и языконезависимые (locale=null).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale");
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        active: true,
        // Границы периода необязательные: null = без ограничения с этой стороны.
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ...(locale ? [{ OR: [{ locale: null }, { locale }] }] : []),
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        imageUrl: true,
        linkUrl: true,
      },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Banners error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
