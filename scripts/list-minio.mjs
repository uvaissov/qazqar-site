import { Client } from "minio";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const client = new Client({
  endPoint: env.MINIO_ENDPOINT || "localhost",
  port: parseInt(env.MINIO_PORT || "9000"),
  useSSL: env.MINIO_USE_SSL === "true",
  accessKey: env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: env.MINIO_SECRET_KEY || "minioadmin",
});

const bucket = env.MINIO_BUCKET || "qazqar-images";

console.log(`Connecting to MinIO: ${env.MINIO_ENDPOINT}:${env.MINIO_PORT || 9000}`);
console.log(`Bucket: ${bucket}`);
console.log("---");

const objects = [];
const stream = client.listObjectsV2(bucket, "", true);

stream.on("data", (obj) => {
  objects.push(obj.name);
});

stream.on("end", () => {
  console.log(`Total objects: ${objects.length}`);
  console.log("");
  for (const name of objects) {
    console.log(name);
  }
});

stream.on("error", (err) => {
  console.error("Error:", err.message);
});
