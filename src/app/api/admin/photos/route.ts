import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, name } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const photo = await prisma.photo.upsert({
    where: { url },
    create: { url, name: name ?? null },
    update: {},
  });

  return NextResponse.json(photo, { status: 201 });
}
