import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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
    const car = await prisma.car.findUnique({
      where: { id },
      include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } } },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error("Get car error:", error);
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    );
  }
}

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
    const {
      modelId,
      inventoryId,
      number,
      techPassport,
      vin,
      year,
      color,
      totalDistance,
      transmission,
      fuelType,
      seats,
      hasAC,
      status,
      slug,
      descriptionRu,
      descriptionKz,
    } = body;

    if (!modelId || !number || !year || !color || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.car.findFirst({
      where: {
        OR: [{ number }, { slug }],
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.number === number
              ? "Car number already exists"
              : "Slug already exists",
        },
        { status: 400 }
      );
    }

    const car = await prisma.car.update({
      where: { id },
      data: {
        modelId,
        inventoryId: Number(inventoryId) || 0,
        number,
        techPassport: techPassport || null,
        vin: vin || null,
        year: Number(year),
        color,
        totalDistance: Number(totalDistance) || 0,
        transmission: transmission || "AUTOMATIC",
        fuelType: fuelType || "AI92",
        seats: Number(seats) || 5,
        hasAC: hasAC ?? true,
        status: status || "AVAILABLE",
        slug,
        descriptionRu: descriptionRu || null,
        descriptionKz: descriptionKz || null,
      },
      include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(car);
  } catch (error) {
    console.error("Update car error:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
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
    const car = await prisma.car.findUnique({ where: { id } });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // CarPhoto records cascade-deleted via onDelete: Cascade
    await prisma.car.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete car error:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}
