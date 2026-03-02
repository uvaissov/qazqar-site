import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "qazqar-images";

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await minioClient.putObject(BUCKET_NAME, fileName, file, file.length, {
    "Content-Type": contentType,
  });
  return `${process.env.NEXT_PUBLIC_MINIO_URL}/${fileName}`;
}

export async function deleteFile(fileName: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, fileName);
}
