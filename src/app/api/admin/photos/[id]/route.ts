import { requireAdmin } from "@/lib/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Try to delete from MinIO (best-effort — don't fail if already gone)
  try {
    const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL ?? "";
    const objectKey = photo.url.startsWith(minioBaseUrl)
      ? photo.url.slice(minioBaseUrl.length + 1)
      : null;
    if (objectKey) {
      await minioClient.removeObject(BUCKET_NAME, objectKey);
    }
  } catch {
    // ignore MinIO errors
  }

  // Delete from DB (CarPhoto cascade via onDelete: Cascade)
  await prisma.photo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
