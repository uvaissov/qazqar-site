import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { approved, authorName, rating, textRu, textKz } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (approved !== undefined) data.approved = approved;
    if (authorName !== undefined) data.authorName = authorName;
    if (rating !== undefined) data.rating = Math.min(5, Math.max(1, Number(rating)));
    if (textRu !== undefined) data.textRu = textRu;
    if (textKz !== undefined) data.textKz = textKz;

    const review = await prisma.review.update({
      where: { id },
      data,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
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
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
