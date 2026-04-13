import { yumeApi } from "@/lib/yume/api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint — remove after investigation
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const action = request.nextUrl.searchParams.get("action");

  if (!id) return NextResponse.json({ error: "pass ?id=955" }, { status: 400 });

  if (action === "comments") {
    // Raw request to see actual response structure
    const comments = await yumeApi.getRequestComments(Number(id));
    return new Response(JSON.stringify(comments), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "docs") {
    const docs = await yumeApi.getRequestDocuments(Number(id));
    return NextResponse.json(docs);
  }

  if (action === "db") {
    const booking = await prisma.booking.findUnique({
      where: { requestId: Number(id) },
    });
    return NextResponse.json({
      id: booking?.id,
      requestId: booking?.requestId,
      status: booking?.status,
      hasDocuments: booking?.documents !== null && booking?.documents !== undefined,
      documentsType: typeof booking?.documents,
      documentsValue: booking?.documents,
      allKeys: booking ? Object.keys(booking) : [],
    });
  }

  const raw = await yumeApi.getRequest(Number(id));
  return NextResponse.json(raw);
}
