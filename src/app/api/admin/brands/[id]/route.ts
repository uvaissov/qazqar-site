import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
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
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.carBrand.findFirst({
      where: {
        OR: [{ name }, { slug }],
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.name === name
              ? "Brand name already exists"
              : "Slug already exists",
        },
        { status: 400 }
      );
    }

    const brand = await prisma.carBrand.update({
      where: { id },
      data: { name, slug },
      include: {
        models: {
          include: {
            _count: {
              select: { cars: true },
            },
          },
        },
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Update brand error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
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

    const brand = await prisma.carBrand.findUnique({
      where: { id },
      include: {
        models: {
          include: {
            _count: {
              select: { cars: true },
            },
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const modelsWithCars = brand.models.filter((m) => m._count.cars > 0);
    if (modelsWithCars.length > 0) {
      return NextResponse.json(
        { error: "Brand has models with cars. Remove cars first." },
        { status: 400 }
      );
    }

    // Delete all models of this brand first, then delete the brand
    await prisma.carModel.deleteMany({ where: { brandId: id } });
    await prisma.carBrand.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
