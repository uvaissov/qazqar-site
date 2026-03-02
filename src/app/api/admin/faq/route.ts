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
    const items = await prisma.faqItem.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Get FAQ items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQ items" },
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
    const { questionRu, questionKz, answerRu, answerKz, sortOrder, published } = body;

    if (!questionRu || !answerRu) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = await prisma.faqItem.create({
      data: {
        questionRu,
        questionKz: questionKz || "",
        answerRu,
        answerKz: answerKz || "",
        sortOrder: sortOrder ?? 0,
        published: published ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create FAQ item error:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ item" },
      { status: 500 }
    );
  }
}
