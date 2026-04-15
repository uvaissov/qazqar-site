import { requireAdmin } from "@/lib/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Parse slug and index from filename like "hyundai-accent-2017-white-1.jpg"
function parseFilename(key: string): { slug: string; index: number } | null {
  const filename = key.split("/").pop();
  if (!filename) return null;

  const withoutExt = filename.replace(/\.[^.]+$/, "");
  // Match trailing -number: "hyundai-accent-2017-white-1" → slug="hyundai-accent-2017-white", index=1
  const match = withoutExt.match(/^(.+)-(\d+)$/);
  if (match) {
    return { slug: match[1], index: parseInt(match[2]) };
  }
  // No index suffix — use full name as slug, index=0
  return { slug: withoutExt, index: 0 };
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const objects: { key: string; size: number }[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = minioClient.listObjectsV2(BUCKET_NAME, "cars/", true);
      stream.on("data", (obj) => {
        if (obj.name) objects.push({ key: obj.name, size: obj.size ?? 0 });
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    return NextResponse.json({ total: objects.length, objects });
  } catch (error) {
    console.error("MinIO list error:", error);
    return NextResponse.json({ error: "Failed to list MinIO objects" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. List all objects in cars/ prefix
    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = minioClient.listObjectsV2(BUCKET_NAME, "cars/", true);
      stream.on("data", (obj) => {
        if (obj.name) keys.push(obj.name);
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL;

    // 2. Load all cars to match by slug
    const cars = await prisma.car.findMany({ select: { id: true, slug: true } });
    const carBySlug = new Map(cars.map((c) => [c.slug, c.id]));

    // 3. Load existing photos to skip duplicates
    const existingPhotos = await prisma.photo.findMany({ select: { url: true } });
    const existingUrls = new Set(existingPhotos.map((p) => p.url));

    const report = {
      total: keys.length,
      photosCreated: 0,
      photosSkipped: 0,
      linksCreated: 0,
      unmatched: [] as string[],
    };

    for (const key of keys) {
      const url = `${minioBaseUrl}/${key}`;
      const parsed = parseFilename(key);

      // Create Photo record if not exists
      let photo = await prisma.photo.findUnique({ where: { url } });
      if (!photo) {
        if (existingUrls.has(url)) {
          report.photosSkipped++;
          photo = await prisma.photo.findFirst({ where: { url } });
        } else {
          const filename = key.split("/").pop() ?? key;
          photo = await prisma.photo.create({
            data: {
              url,
              name: filename,
            },
          });
          report.photosCreated++;
        }
      } else {
        report.photosSkipped++;
      }

      if (!photo) continue;

      // Try to link to a car by slug
      if (parsed) {
        const carId = carBySlug.get(parsed.slug);
        if (carId) {
          // Create CarPhoto if not exists
          const existing = await prisma.carPhoto.findUnique({
            where: { carId_photoId: { carId, photoId: photo.id } },
          });
          if (!existing) {
            await prisma.carPhoto.create({
              data: { carId, photoId: photo.id, sortOrder: parsed.index },
            });
            report.linksCreated++;
          }
        } else {
          report.unmatched.push(key);
        }
      } else {
        report.unmatched.push(key);
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Failed to restore photos" }, { status: 500 });
  }
}
