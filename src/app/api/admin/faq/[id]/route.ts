import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { questionRu, questionKz, answerRu, answerKz, sortOrder, published } = body;

    if (!questionRu || !answerRu) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = await prisma.faqItem.update({
      where: { id },
      data: {
        questionRu,
        questionKz: questionKz || "",
        answerRu,
        answerKz: answerKz || "",
        sortOrder: sortOrder ?? 0,
        published: published ?? true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update FAQ item error:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.faqItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete FAQ item error:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ item" },
      { status: 500 }
    );
  }
}
