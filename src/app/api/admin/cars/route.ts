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
      include: { model: { include: { brand: true } } },
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
      licensePlate,
      year,
      color,
      pricePerDay,
      transmission,
      fuelType,
      seats,
      hasAC,
      status,
      images,
      slug,
      descriptionRu,
      descriptionKz,
    } = body;

    if (!modelId || !licensePlate || !year || !color || !pricePerDay || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.car.findFirst({
      where: {
        OR: [{ licensePlate }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.licensePlate === licensePlate
              ? "License plate already exists"
              : "Slug already exists",
        },
        { status: 400 }
      );
    }

    const car = await prisma.car.create({
      data: {
        modelId,
        licensePlate,
        year: Number(year),
        color,
        pricePerDay: Number(pricePerDay),
        transmission: transmission || "AUTOMATIC",
        fuelType: fuelType || "AI92",
        seats: Number(seats) || 5,
        hasAC: hasAC ?? true,
        status: status || "AVAILABLE",
        images: images || [],
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
