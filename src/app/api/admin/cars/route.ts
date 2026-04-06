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
    const cars = await prisma.car.findMany({
      include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cars);
  } catch (error) {
    console.error("Get cars error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
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

    const car = await prisma.car.create({
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
      include: { model: { include: { brand: true } } },
    });

    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    console.error("Create car error:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}
