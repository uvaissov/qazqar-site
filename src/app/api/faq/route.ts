import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await prisma.faqItem.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        questionRu: true,
        questionKz: true,
        answerRu: true,
        answerKz: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("FAQ error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
