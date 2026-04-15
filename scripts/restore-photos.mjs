import { Client } from "minio";
import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "pg";
const { Client: PgClient } = postgres;

const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const minio = new Client({
  endPoint: env.MINIO_ENDPOINT || "localhost",
  port: parseInt(env.MINIO_PORT || "9000"),
  useSSL: env.MINIO_USE_SSL === "true",
  accessKey: env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: env.MINIO_SECRET_KEY || "minioadmin",
});

const db = new PgClient({ connectionString: env.DATABASE_URL });
await db.connect();

// 1. List all MinIO objects
const keys = [];
await new Promise((resolve, reject) => {
  const stream = minio.listObjectsV2(env.MINIO_BUCKET || "qazqar-images", "", true);
  stream.on("data", (obj) => { if (obj.name) keys.push(obj.name); });
  stream.on("end", resolve);
  stream.on("error", reject);
});

// 2. Upsert all photos into DB
let created = 0;
for (const key of keys) {
  const url = `${env.NEXT_PUBLIC_MINIO_URL}/${key}`;
  const name = key.split("/").pop();
  const { rowCount } = await db.query(
    'INSERT INTO photos (id, url, name, "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW()) ON CONFLICT (url) DO NOTHING',
    [url, name]
  );
  if (rowCount > 0) { created++; console.log(`+ ${key}`); }
}

// 3. Clear all car-photo links
const { rowCount } = await db.query("DELETE FROM car_photos");

await db.end();
console.log(`\nPhotos: ${created} created, ${keys.length - created} skipped`);
console.log(`Car links removed: ${rowCount}`);
