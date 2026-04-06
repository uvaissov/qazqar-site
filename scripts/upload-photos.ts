import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9002,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET = process.env.MINIO_BUCKET || 'qazqar-images';
const PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9002/qazqar-images';
const PHOTOS_DIR = '/tmp/qazqar-photos';

// Map: photo file → which models/colors it applies to
// We assign photos by model name, since all cars of same model look the same
const PHOTO_MAP: { model: string; year?: { min: number; max: number }; color?: string; file: string }[] = [
  // Accent
  { model: 'Accent', year: { min: 2017, max: 2018 }, file: 'accent-2018.jpg' },
  { model: 'Accent', year: { min: 2019, max: 2019 }, file: 'accent-2019.jpg' },
  { model: 'Accent', year: { min: 2021, max: 2021 }, file: 'accent-gray.jpg' },
  { model: 'Accent', year: { min: 2023, max: 2025 }, file: 'accent-2023.jpg' },

  // Elantra
  { model: 'Elantra', year: { min: 2021, max: 2022 }, file: 'elantra-white.jpg' },
  { model: 'Elantra', year: { min: 2024, max: 2024 }, file: 'elantra-2024.jpg' },
  { model: 'Elantra', year: { min: 2025, max: 2025 }, file: 'elantra-2025.jpg' },

  // Sonata
  { model: 'Sonata', year: { min: 2022, max: 2022 }, file: 'sonata-white.jpg' },
  { model: 'Sonata', year: { min: 2023, max: 2025 }, file: 'sonata-gray.jpg' },

  // Tucson
  { model: 'Tucson', year: { min: 2023, max: 2023 }, file: 'tucson-2023.jpg' },
  { model: 'Tucson', year: { min: 2024, max: 2024 }, file: 'tucson-2024.jpg' },
  { model: 'Tucson', year: { min: 2025, max: 2025 }, file: 'tucson-2025.jpg' },

  // K5
  { model: 'K5', file: 'k5-white.jpg' },
];

async function main() {
  // Upload all unique photos to MinIO
  const uploadedFiles = new Map<string, string>(); // file → public URL

  for (const entry of PHOTO_MAP) {
    if (uploadedFiles.has(entry.file)) continue;

    const filePath = path.join(PHOTOS_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skip: ${entry.file} not found`);
      continue;
    }

    const minioPath = `cars/${entry.file}`;
    await minio.fPutObject(BUCKET, minioPath, filePath, {
      'Content-Type': 'image/jpeg',
    });

    const publicUrl = `${PUBLIC_URL}/${minioPath}`;
    uploadedFiles.set(entry.file, publicUrl);
    console.log(`Uploaded: ${entry.file} → ${publicUrl}`);
  }

  // Create Photo records and link to cars
  const cars = await prisma.car.findMany({
    include: { model: true, photos: true },
  });

  // Upsert Photo records
  const photoRecords = new Map<string, string>(); // url → photoId
  for (const [, url] of uploadedFiles) {
    const photo = await prisma.photo.upsert({
      where: { url },
      update: {},
      create: { url, name: url.split('/').pop() || null },
    });
    photoRecords.set(url, photo.id);
  }

  let linked = 0;
  for (const car of cars) {
    const rule = PHOTO_MAP.find((r) => {
      if (r.model !== car.model.name) return false;
      if (r.year && (car.year < r.year.min || car.year > r.year.max)) return false;
      return true;
    });

    if (!rule) continue;

    const imageUrl = uploadedFiles.get(rule.file);
    if (!imageUrl) continue;

    const photoId = photoRecords.get(imageUrl);
    if (!photoId) continue;

    // Skip if already linked
    if (car.photos.some((cp: { photoId: string }) => cp.photoId === photoId)) continue;

    await prisma.carPhoto.create({
      data: { carId: car.id, photoId, sortOrder: 0 },
    });
    linked++;
  }

  console.log(`\nDone: ${uploadedFiles.size} photos uploaded, ${photoRecords.size} photo records, ${linked} cars linked`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
