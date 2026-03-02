import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/minio";
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
      include: { model: { include: { brand: true } } },
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
        NOT: { id },
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

    const car = await prisma.car.update({
      where: { id },
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

    // Delete associated images from MinIO
    for (const imageUrl of car.images) {
      try {
        // Extract fileName from URL: http://host/bucket/cars/filename.ext -> cars/filename.ext
        const urlParts = imageUrl.split("/");
        const bucketIndex = urlParts.findIndex(
          (part) => part === "qazqar-images"
        );
        if (bucketIndex !== -1) {
          const fileName = urlParts.slice(bucketIndex + 1).join("/");
          await deleteFile(fileName);
        }
      } catch (e) {
        console.error("Failed to delete image:", imageUrl, e);
      }
    }

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
