// Приводит телефоны в БД к каноническому виду (+7XXXXXXXXXX).
//
// По умолчанию — dry-run: печатает, что будет сделано, и ничего не пишет.
// Запись только с флагом --apply:
//
//   npx tsx scripts/normalize-phones.ts            # отчёт
//   npx tsx scripts/normalize-phones.ts --apply    # применить
//
// users.phone объявлен @unique, поэтому при схлопывании форматов возможен
// конфликт: «7774904900» и «+77774904900» — один номер в двух аккаунтах.
// Правило: номер остаётся у самого раннего по createdAt, остальным NULL.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePhone } from "../src/lib/phone";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const APPLY = process.argv.includes("--apply");

type Decision = {
  id: string;
  email: string | null;
  before: string;
  after: string | null;
  reason: string;
};

async function normalizeUsers(): Promise<Decision[]> {
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, phone: true, isResident: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const decisions: Decision[] = [];
  const claimed = new Map<string, string>(); // canonical -> userId

  for (const user of users) {
    const before = user.phone!;
    const result = normalizePhone(before, { resident: user.isResident !== false });

    if (!result.ok) {
      decisions.push({
        id: user.id,
        email: user.email,
        before,
        after: null,
        reason: "не разбирается — обнуляем",
      });
      continue;
    }

    const owner = claimed.get(result.phone);
    if (owner && owner !== user.id) {
      decisions.push({
        id: user.id,
        email: user.email,
        before,
        after: null,
        reason: `дубль ${result.phone} — номер остаётся у ${owner}`,
      });
      continue;
    }

    claimed.set(result.phone, user.id);
    decisions.push({
      id: user.id,
      email: user.email,
      before,
      after: result.phone,
      reason: before === result.phone ? "без изменений" : "нормализован",
    });
  }

  return decisions;
}

async function normalizeBookings(): Promise<Decision[]> {
  const bookings = await prisma.booking.findMany({
    where: { customerPhone: { not: "" } },
    select: { id: true, customerPhone: true, customerName: true },
  });

  const decisions: Decision[] = [];
  for (const booking of bookings) {
    const before = booking.customerPhone;
    const result = normalizePhone(before, { resident: true });
    // Уникальности здесь нет — неразобранное значение оставляем как есть.
    if (!result.ok || result.phone === before) continue;
    decisions.push({
      id: booking.id,
      email: booking.customerName,
      before,
      after: result.phone,
      reason: "нормализован",
    });
  }
  return decisions;
}

function report(title: string, decisions: Decision[]) {
  console.log(`\n=== ${title} (${decisions.length}) ===`);
  if (decisions.length === 0) {
    console.log("  нечего менять");
    return;
  }
  for (const d of decisions) {
    const after = d.after ?? "NULL";
    console.log(`  ${d.before.padEnd(16)} → ${after.padEnd(16)} ${d.email ?? ""} — ${d.reason}`);
  }
}

async function main() {
  const userDecisions = await normalizeUsers();
  const bookingDecisions = await normalizeBookings();

  const userChanges = userDecisions.filter((d) => d.reason !== "без изменений");

  report("users.phone", userDecisions);
  report("bookings.customerPhone", bookingDecisions);

  if (!APPLY) {
    console.log(
      `\nDry-run. К записи: ${userChanges.length} пользователей, ${bookingDecisions.length} броней.`
    );
    console.log("Запусти с --apply, чтобы применить.");
    return;
  }

  // Сначала обнуляем конфликтующие, потом пишем канонические: иначе unique-индекс
  // отобьёт запись «+7777…» пока старое значение ещё занято другой строкой.
  for (const d of userChanges.filter((x) => x.after === null)) {
    await prisma.user.update({ where: { id: d.id }, data: { phone: null } });
  }
  for (const d of userChanges.filter((x) => x.after !== null)) {
    await prisma.user.update({ where: { id: d.id }, data: { phone: d.after } });
  }
  for (const d of bookingDecisions) {
    await prisma.booking.update({
      where: { id: d.id },
      data: { customerPhone: d.after! },
    });
  }

  console.log(
    `\nГотово: обновлено ${userChanges.length} пользователей, ${bookingDecisions.length} броней.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
