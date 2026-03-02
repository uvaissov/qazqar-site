import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const models = await prisma.carModel.findMany({
      include: {
        brand: true,
        _count: {
          select: { cars: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(models);
  } catch (error) {
    console.error("Get models error:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
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
    const { name, slug, brandId } = body;

    if (!name || !slug || !brandId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingSlug = await prisma.carModel.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const brand = await prisma.carBrand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const model = await prisma.carModel.create({
      data: { name, slug, brandId },
      include: {
        brand: true,
        _count: {
          select: { cars: true },
        },
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Create model error:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    );
  }
}
