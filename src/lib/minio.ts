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

/// Откат уже залитых файлов, когда следующий шаг упал.
///
/// Никогда не бросает: вызывается из catch-блоков, и своя ошибка затёрла бы
/// исходную причину — пользователь получил бы жалобу на MinIO вместо настоящей.
export async function deleteFilesQuietly(fileNames: string[]): Promise<void> {
  await Promise.all(
    fileNames.map((fileName) =>
      deleteFile(fileName).catch((err) =>
        console.error(`[MinIO] Cleanup failed for "${fileName}":`, err)
      )
    )
  );
}
