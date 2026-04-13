import { prisma } from "@/lib/prisma";
import { yumeApi } from "./api";
import type { YumeInventory, YumeScheduleInventory } from "./api";

const STATUS_INTERVAL = 60_000; // 1 minute — car statuses (schedules)
const BOOKINGS_INTERVAL = 60_000; // 1 minute — active booking status polling
const INVENTORY_INTERVAL = 3_600_000; // 1 hour — full car inventory

let statusTimer: ReturnType<typeof setInterval> | null = null;
let bookingsTimer: ReturnType<typeof setInterval> | null = null;
let inventoryTimer: ReturnType<typeof setInterval> | null = null;

const BOOKING_STATUS_MAP: Record<string, string> = {
  request: "PENDING",
  reserve: "CONFIRMED",
  inrent: "ACTIVE",
  exceed: "ACTIVE",
  completed: "COMPLETED",
  debtor: "COMPLETED",
  cancelled: "CANCELLED",
  cancel: "CANCELLED",
};

// Use globalThis to share state between instrumentation and API routes
const g = globalThis as unknown as {
  __syncLastAt?: Date;
  __syncInventoryLastAt?: Date;
  __syncResult?: { cars: number; rented: number; booked: number };
};

export function getSyncStatus() {
  return {
    lastSyncAt: g.__syncLastAt?.toISOString() || null,
    lastInventorySyncAt: g.__syncInventoryLastAt?.toISOString() || null,
    nextSyncAt: g.__syncLastAt ? new Date(g.__syncLastAt.getTime() + STATUS_INTERVAL).toISOString() : null,
    result: g.__syncResult || null,
  };
}

export function startSync() {
  if (statusTimer) return;

  console.log("[Sync] Starting sync: inventories every 60min, statuses+bookings every 60s");

  // First sync — both inventories and statuses
  syncCars().catch((err) =>
    console.error("[Sync] Initial sync failed:", err.message)
  );

  // Inventories — every hour
  inventoryTimer = setInterval(() => {
    syncInventories().catch((err) =>
      console.error("[Sync] Inventory sync failed:", err.message)
    );
  }, INVENTORY_INTERVAL);

  // Statuses — every minute
  statusTimer = setInterval(() => {
    syncStatuses().catch((err) =>
      console.error("[Sync] Status sync failed:", err.message)
    );
  }, STATUS_INTERVAL);

  // Active bookings — every minute
  bookingsTimer = setInterval(() => {
    syncActiveBookings().catch((err) =>
      console.error("[Sync] Bookings sync failed:", err.message)
    );
  }, BOOKINGS_INTERVAL);
}

export function stopSync() {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
  if (inventoryTimer) {
    clearInterval(inventoryTimer);
    inventoryTimer = null;
  }
  if (bookingsTimer) {
    clearInterval(bookingsTimer);
    bookingsTimer = null;
  }
  console.log("[Sync] Stopped");
}

/** Sync car inventories — upsert brands, models, cars (heavy, runs hourly) */
async function syncInventories() {
  const start = Date.now();
  const inventories = await yumeApi.getAllInventories();

  let carsUpserted = 0;
  for (const inv of inventories) {
    await upsertCar(inv);
    carsUpserted++;
  }

  const elapsed = Date.now() - start;
  g.__syncInventoryLastAt = new Date();
  console.log(`[Sync] Inventories done in ${elapsed}ms: ${carsUpserted} cars`);
  return carsUpserted;
}

/** Sync car statuses from schedules (lightweight, runs every minute) */
async function syncStatuses() {
  const start = Date.now();

  const now = new Date();
  const startAt = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endAt = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    .toISOString()
    .split("T")[0];

  const scheduleInventories = await yumeApi.getAllSchedules(startAt, endAt);
  const statusMap = getInventoryStatuses(scheduleInventories);
  let rentedCount = 0;

  // Reset all cars with inventoryId
  const inventoryIds = scheduleInventories.map((i) => i.id);
  await prisma.car.updateMany({
    where: { inventoryId: { in: inventoryIds } },
    data: { status: "AVAILABLE", nextBookingAt: null, availableFrom: null },
  });

  for (const [inventoryId, info] of statusMap) {
    await prisma.car.updateMany({
      where: { inventoryId },
      data: {
        status: info.isRented ? "RENTED" : "AVAILABLE",
        nextBookingAt: info.nextBookingAt,
        availableFrom: info.availableFrom,
      },
    });
    if (info.isRented) rentedCount++;
  }

  const bookedCount = [...statusMap.values()].filter((s) => s.nextBookingAt).length;
  const elapsed = Date.now() - start;

  g.__syncLastAt = new Date();
  g.__syncResult = { ...g.__syncResult, rented: rentedCount, booked: bookedCount };

  console.log(`[Sync] Statuses done in ${elapsed}ms: ${rentedCount} rented, ${bookedCount} booked`);
}

/** Poll active bookings in CRM for status changes and sync documents */
async function syncActiveBookings() {
  // Get all non-terminal bookings that have a CRM requestId
  const activeBookings = await prisma.booking.findMany({
    where: {
      requestId: { not: null },
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
    },
    select: { id: true, requestId: true, status: true },
  });

  if (activeBookings.length === 0) return;

  let updated = 0;
  for (const booking of activeBookings) {
    try {
      const req = await yumeApi.getRequestOrOrder(booking.requestId!);
      const newStatus = BOOKING_STATUS_MAP[req.status_color] || booking.status;

      // Sync documents for CONFIRMED/ACTIVE bookings
      let documents: unknown | undefined;
      if (["CONFIRMED", "ACTIVE"].includes(newStatus)) {
        try {
          const docs = await yumeApi.getRequestDocuments(booking.requestId!);
          documents = docs.map((doc) => {
            const signers = doc.signs.map((s) => ({
              name: s.signer?.name || "",
              type: s.signer?.type || "client",
              signed: s.status === 5,
              signUrl: `https://yume.kz/documents/${s.uuid}`,
            }));
            const clientSign = doc.signs.find((s) => s.signer?.type === "client");
            const docUrl = clientSign
              ? `https://yume.kz/documents/${clientSign.uuid}`
              : `https://yume.kz/documents/${doc.uuid}`;
            const hasClient = signers.some((s) => s.type === "client");
            const hasCompany = signers.some((s) => s.type !== "client");
            const allSigned = hasClient && hasCompany && signers.every((s) => s.signed);
            const partiallySigned = signers.some((s) => s.signed) && !allSigned;
            return {
              name: doc.name.replace(/ - \d+$/, ""),
              allSigned,
              partiallySigned,
              docUrl,
              signers,
            };
          });
        } catch {
          // CRM unavailable — keep existing documents
        }
      }

      if (newStatus !== booking.status || documents) {
        let cancellationReason: string | undefined;

        if (newStatus === "CANCELLED") {
          try {
            const comments = await yumeApi.getRequestComments(booking.requestId!);
            if (comments.length > 0) {
              cancellationReason = comments.map((c) => c.body).join("; ");
            }
          } catch (err) {
            console.error(`[Sync] Failed to fetch comments for CRM #${booking.requestId}:`, (err as Error).message);
          }
        }

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            ...(newStatus !== booking.status && {
              status: newStatus,
              startDate: new Date(req.rent_start),
              endDate: new Date(req.rent_end),
              totalPrice: Math.round(parseFloat(req.price)),
            }),
            ...(cancellationReason && { cancellationReason }),
            ...(documents && { documents }),
          },
        });

        if (newStatus !== booking.status) {
          updated++;
          console.log(`[Sync] Booking ${booking.id} (CRM #${booking.requestId}): ${booking.status} → ${newStatus}`);
        }
      }
    } catch (err) {
      console.error(`[Sync] Failed to poll CRM request #${booking.requestId}:`, (err as Error).message);
    }
  }

  if (updated > 0) {
    console.log(`[Sync] Bookings: ${updated} updated out of ${activeBookings.length} active`);
  }
}

/** Full sync — inventories + statuses (used on startup and manual trigger) */
export async function syncCars() {
  const carsUpserted = await syncInventories();
  await syncStatuses();
  g.__syncResult = { ...g.__syncResult!, cars: carsUpserted };
}

async function upsertCar(inv: YumeInventory) {
  const brandName = inv.car.brand;
  const modelName = inv.car.model;
  const brandSlug = brandName.toLowerCase().replace(/\s+/g, "-");
  const modelSlug = modelName.toLowerCase().replace(/\s+/g, "-");

  // Upsert brand
  const brand = await prisma.carBrand.upsert({
    where: { slug: brandSlug },
    update: { name: brandName },
    create: { name: brandName, slug: brandSlug },
  });

  // Upsert model
  const model = await prisma.carModel.upsert({
    where: { slug: modelSlug },
    update: { name: modelName, brandId: brand.id },
    create: { name: modelName, slug: modelSlug, brandId: brand.id },
  });

  // Parse year from extra.made or name
  let year = 2024;
  if (inv.extra.made) {
    year = parseInt(inv.extra.made, 10) || 2024;
  } else {
    const nameMatch = inv.name.match(/\d{4}/);
    if (nameMatch) year = parseInt(nameMatch[0], 10);
  }

  const color = inv.extra.color || "Unknown";
  const carSlug = `${brandSlug}-${modelSlug}-${inv.car.number.toLowerCase().replace(/\s+/g, "")}`;

  // Get price from tarifs (first published tarif), fallback to 15000
  const publishedTarif = inv.tarifs?.find((t) => t.published);
  const pricePerDay = publishedTarif ? Math.round(parseFloat(publishedTarif.price)) : undefined;

  // Upsert car by inventoryId
  // Update: only API fields (number, year, color, vin, techPassport, totalDistance, pricePerDay)
  // Create: set defaults for local fields (slug, transmission, etc.)
  // Never overwrite: photos, descriptions, slug, transmission, fuelType, seats, hasAC
  await prisma.car.upsert({
    where: { inventoryId: inv.id },
    update: {
      modelId: model.id,
      number: inv.car.number,
      techPassport: inv.car.tech_passport || null,
      vin: inv.extra.vin || null,
      year,
      color,
      totalDistance: inv.extra.total_distance || 0,
      ...(pricePerDay && { pricePerDay }),
    },
    create: {
      inventoryId: inv.id,
      modelId: model.id,
      number: inv.car.number,
      techPassport: inv.car.tech_passport || null,
      vin: inv.extra.vin || null,
      year,
      color,
      totalDistance: inv.extra.total_distance || 0,
      transmission: "AUTOMATIC",
      fuelType: "AI92",
      seats: 5,
      hasAC: true,
      status: "AVAILABLE",
      slug: carSlug,
    },
  });
}

type InventoryStatus = {
  isRented: boolean;
  availableFrom: Date | null;   // when current rental ends
  nextBookingAt: Date | null;   // nearest future booking start
};

function getInventoryStatuses(
  scheduleInventories: YumeScheduleInventory[]
): Map<number, InventoryStatus> {
  const now = new Date();
  const result = new Map<number, InventoryStatus>();

  for (const inv of scheduleInventories) {
    // "reserve" = booked, "inrent" = car on hands, "exceed" = overdue
    const relevantBookings = inv.schedules.filter(
      (s) => s.request_status_color === "reserve" || s.request_status_color === "inrent" || s.request_status_color === "exceed"
    );

    if (relevantBookings.length === 0) continue;

    let isRented = false;
    let availableFrom: Date | null = null;
    let nextBookingAt: Date | null = null;

    for (const schedule of relevantBookings) {
      const start = new Date(schedule.start_at);
      const end = new Date(schedule.end_at);
      const isOnHands = schedule.request_status_color === "inrent" || schedule.request_status_color === "exceed";

      // Car is on hands (active/exceed) — overdue if end < now
      if (isOnHands) {
        isRented = true;
        if (end < now) {
          // Overdue — no known return date
          availableFrom = null;
        } else {
          if (!availableFrom || end > availableFrom) {
            availableFrom = end;
          }
        }
        continue;
      }

      // Currently rented (reserve within date range)
      if (now >= start && now <= end) {
        isRented = true;
        if (!availableFrom || end > availableFrom) {
          availableFrom = end;
        }
      }

      // Future booking
      if (start > now) {
        if (!nextBookingAt || start < nextBookingAt) {
          nextBookingAt = start;
        }
      }
    }

    result.set(inv.id, { isRented, availableFrom, nextBookingAt });
  }

  return result;
}
