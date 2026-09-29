// Переносит статьи блога со старого сайта qazqar.kz (Laravel, 86.107.45.148).
//
// Источник — scripts/legacy-blog/posts.json (выгрузка таблиц posts + article_post)
// и scripts/legacy-blog/covers/{mediaId}/{file} (public/uploads/post image старого сайта).
// Slug сохраняется как был: статьи открываются по старым адресам /p/{slug}
// (см. src/lib/blog-url.ts), поэтому переиндексации не будет.
//
// По умолчанию — dry-run. Запись только с --apply:
//
//   npx tsx scripts/import-legacy-blog.ts                  # отчёт
//   npx tsx scripts/import-legacy-blog.ts --apply          # применить
//   docker exec qazqar-app npx tsx scripts/import-legacy-blog.ts --apply   # на проде
//
// Идемпотентен: статья ищется по slug и обновляется, обложка в MinIO
// перезаливается под тем же именем (blog/legacy/{старый id}.{ext}).
// Автор — первый ADMIN (или --author=email).

import "dotenv/config";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { uploadFile } from "../src/lib/minio";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const APPLY = process.argv.includes("--apply");
const AUTHOR_EMAIL = process.argv.find((a) => a.startsWith("--author="))?.slice(9);

const DIR = "scripts/legacy-blog"; // запуск из корня проекта, как у import-tariffs
const RU_LANG_ID = 6; // languages.id старого сайта

type LegacyPost = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  lang: number;
  createdAt: string;
  updatedAt: string;
  content: string | null;
  cover: string | null;
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Ссылки на старый сайт → новые адреса; первый абзац-дубль заголовка убираем (заголовок уже в h1). */
function convertContent(html: string, title: string): string {
  return html
    .replace(/https?:\/\/(?:www\.)?(?:qazqar|pcar)\.kz\/catalog\/?/g, "/ru/catalog")
    .replace(/https?:\/\/(?:www\.)?(?:qazqar|pcar)\.kz\/p\//g, "/p/")
    .replace(/https?:\/\/(?:www\.)?(?:qazqar|pcar)\.kz\/?(?=["'])/g, "/ru")
    .replace(/^\s*<p>([^<]*)<\/p>\s*/, (m, text: string) =>
      text.trim() === title.trim() ? "" : m
    )
    .trim();
}

/** Старые даты — время сервера в Астане (UTC+5), без зоны. */
function parseLegacyDate(value: string): Date {
  return new Date(`${value.replace(" ", "T")}+05:00`);
}

async function main() {
  const posts: LegacyPost[] = JSON.parse(readFileSync(join(DIR, "posts.json"), "utf8"));

  const author = await prisma.user.findFirst({
    where: AUTHOR_EMAIL ? { email: AUTHOR_EMAIL } : { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  if (!author) throw new Error(`Автор не найден (${AUTHOR_EMAIL ?? "нет ADMIN"})`);
  console.log(`Автор: ${author.email}${APPLY ? "" : "  [dry-run]"}\n`);

  for (const post of posts) {
    if (post.lang !== RU_LANG_ID || !post.content?.trim() || !post.slug) {
      console.log(`  пропуск #${post.id} ${post.slug} — не русская или пустая`);
      continue;
    }

    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    const action = existing ? "обновить" : "создать";
    console.log(`  ${action} /p/${post.slug}`);
    if (!APPLY) continue;

    let coverImage = existing?.coverImage ?? null;
    if (post.cover) {
      const ext = extname(post.cover).toLowerCase();
      const contentType = CONTENT_TYPES[ext];
      if (!contentType) throw new Error(`#${post.id}: неизвестный тип обложки ${post.cover}`);
      const file = readFileSync(join(DIR, "covers", post.cover));
      coverImage = await uploadFile(file, `blog/legacy/${post.id}${ext}`, contentType);
    }

    const data = {
      titleRu: post.title.trim(),
      contentRu: convertContent(post.content, post.title),
      descriptionRu: post.description?.trim() ?? "",
      coverImage,
      published: true,
      createdAt: parseLegacyDate(post.createdAt),
    };

    if (existing) {
      await prisma.blogPost.update({ where: { id: existing.id }, data });
    } else {
      await prisma.blogPost.create({ data: { ...data, slug: post.slug, authorId: author.id } });
    }
  }

  console.log(APPLY ? "\nГотово." : "\nDry-run. Для записи — --apply.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
