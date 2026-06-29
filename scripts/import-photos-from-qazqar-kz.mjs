// Импорт фото авто с qazqar.kz/catalog в MinIO + БД стейджинга.
// Матчинг по бренд+модель+год (фолбэк — ближайший год той же модели).
// Запускается ВНУТРИ app-контейнера (есть minio, pg, доступ к БД/MinIO/интернету).
import * as Minio from "minio";
import pg from "pg";
import crypto from "crypto";

const BUCKET = process.env.MINIO_BUCKET || "qazqar-images";
const PUBLIC_URL = (process.env.NEXT_PUBLIC_MINIO_URL || "").replace(/\/$/, "");

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// 1. Парсим qazqar.kz/catalog
const html = await (await fetch("https://qazqar.kz/catalog")).text();
const blobs = [...html.matchAll(/data=(%7B.*?%7D)"/g)].map((m) => m[1]);
const seen = new Set();
const src = [];
for (const b of blobs) {
  let j;
  try { j = JSON.parse(decodeURIComponent(b)); } catch { continue; }
  if (!j.photo) continue;
  const k = `${j.brand}|${j.mark}|${j.year}|${j.color}`;
  if (seen.has(k)) continue;
  seen.add(k);
  src.push({ brand: String(j.brand), model: String(j.mark), year: parseInt(j.year), photo: j.photo });
}
console.log(`qazqar.kz: ${src.length} уникальных авто с фото`);

// brand|model -> [{year, photo}]
const byModel = new Map();
for (const c of src) {
  const key = `${c.brand}|${c.model}`.toLowerCase();
  if (!byModel.has(key)) byModel.set(key, []);
  byModel.get(key).push({ year: c.year, photo: c.photo });
}

function pickPhoto(brand, model, year) {
  const list = byModel.get(`${brand}|${model}`.toLowerCase());
  if (!list || !list.length) return null;
  const exact = list.find((x) => x.year === year);
  if (exact) return exact.photo;
  // ближайший год
  return list.slice().sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0].photo;
}

// 2. Авто стейджинга
const { rows: cars } = await db.query(
  `SELECT c.id, c.year, m.name AS model, b.name AS brand
   FROM cars c JOIN car_models m ON m.id = c."modelId"
   JOIN car_brands b ON b.id = m."brandId" ORDER BY b.name, m.name, c.year`
);
console.log(`стейджинг: ${cars.length} авто`);

// 3. Кэш загруженных фото: srcURL -> photoId
const photoIdBySrc = new Map();

async function ensurePhoto(srcUrl) {
  if (photoIdBySrc.has(srcUrl)) return photoIdBySrc.get(srcUrl);
  const hash = crypto.createHash("sha1").update(srcUrl).digest("hex").slice(0, 24);
  const key = `cars/${hash}.jpg`;
  const publicUrl = `${PUBLIC_URL}/${key}`;
  // уже есть в БД?
  let { rows } = await db.query(`SELECT id FROM photos WHERE url=$1`, [publicUrl]);
  if (rows.length) { photoIdBySrc.set(srcUrl, rows[0].id); return rows[0].id; }
  // скачать + залить в MinIO
  const resp = await fetch(srcUrl);
  if (!resp.ok) { console.log(`  ! фото не скачалось ${srcUrl} (${resp.status})`); return null; }
  const buf = Buffer.from(await resp.arrayBuffer());
  await minio.putObject(BUCKET, key, buf, buf.length, { "Content-Type": "image/jpeg" });
  const ins = await db.query(
    `INSERT INTO photos (id, url, name, "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())
     ON CONFLICT (url) DO UPDATE SET url=EXCLUDED.url RETURNING id`,
    [publicUrl, `${key}`]
  );
  const id = ins.rows[0].id;
  photoIdBySrc.set(srcUrl, id);
  console.log(`  + залито ${key} (${(buf.length/1024).toFixed(0)}kb)`);
  return id;
}

// 4. Матч + связи
let linked = 0, skipped = 0;
for (const car of cars) {
  const photo = pickPhoto(car.brand, car.model, car.year);
  if (!photo) { console.log(`  - нет фото для ${car.brand} ${car.model} ${car.year}`); skipped++; continue; }
  const photoId = await ensurePhoto(photo);
  if (!photoId) { skipped++; continue; }
  await db.query(
    `INSERT INTO car_photos ("carId", "photoId", "sortOrder") VALUES ($1,$2,0)
     ON CONFLICT ("carId","photoId") DO NOTHING`,
    [car.id, photoId]
  );
  linked++;
}

console.log(`\nГотово: связано ${linked} авто, пропущено ${skipped}. Уникальных фото: ${photoIdBySrc.size}`);
await db.end();
