import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const brands = await prisma.carBrand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    const result = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logo,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Brands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
