import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Список моделей для фильтра каталога.
 *
 * По умолчанию отдаём только модели, у которых есть машины: показывать в
 * фильтре вариант, дающий пустой список, — способ разозлить пользователя.
 * `?all=true` снимает это ограничение (для админских сценариев).
 * `?brand=<slug>` сужает до одной марки.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get("brand");
    const all = searchParams.get("all") === "true";

    const models = await prisma.carModel.findMany({
      where: {
        ...(brandSlug ? { brand: { slug: brandSlug } } : {}),
        ...(all ? {} : { cars: { some: {} } }),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: { select: { id: true, name: true, slug: true } },
        _count: { select: { cars: true } },
      },
    });

    const result = models.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      brand: m.brand,
      carsCount: m._count.cars,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Models error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
