import { prisma } from "@/lib/prisma";
import { yumeApi } from "./api";
import type { YumeInventory, YumeScheduleInventory } from "./api";

const SYNC_INTERVAL = 60_000; // 1 minute

let syncTimer: ReturnType<typeof setInterval> | null = null;

export function startSync() {
  if (syncTimer) return;

  console.log("[Sync] Starting car sync scheduler (every 60s)");

  // First sync immediately
  syncCars().catch((err) =>
    console.error("[Sync] Initial sync failed:", err.message)
  );

  // Then every minute
  syncTimer = setInterval(() => {
    syncCars().catch((err) =>
      console.error("[Sync] Sync failed:", err.message)
    );
  }, SYNC_INTERVAL);
}

export function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log("[Sync] Stopped");
  }
}

export async function syncCars() {
  const start = Date.now();

  // 1. Fetch inventories from API
  const inventories = await yumeApi.getAllInventories();

  // 2. Upsert brands, models, cars
  let carsUpserted = 0;
  for (const inv of inventories) {
    await upsertCar(inv);
    carsUpserted++;
  }

  // 3. Fetch schedules — current month + next month (to catch upcoming bookings)
  const now = new Date();
  const startAt = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endAt = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    .toISOString()
    .split("T")[0];

  const scheduleInventories = await yumeApi.getAllSchedules(startAt, endAt);

  // 4. Update car statuses and booking info
  const statusMap = getInventoryStatuses(scheduleInventories);
  let rentedCount = 0;

  // Reset all synced cars
  await prisma.car.updateMany({
    where: { inventoryId: { in: inventories.map((i) => i.id) } },
    data: { status: "AVAILABLE", nextBookingAt: null, availableFrom: null },
  });

  // Update each car with schedule info
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
  console.log(
    `[Sync] Done in ${elapsed}ms: ${carsUpserted} cars, ${rentedCount} rented, ${bookedCount} with upcoming bookings`
  );
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

  // Upsert car by inventoryId
  // Update: only API fields (number, year, color, vin, techPassport, totalDistance)
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
    const activeBookings = inv.schedules.filter(
      (s) => s.request_status_color === "reserve"
    );

    if (activeBookings.length === 0) continue;

    let isRented = false;
    let availableFrom: Date | null = null;
    let nextBookingAt: Date | null = null;

    for (const schedule of activeBookings) {
      const start = new Date(schedule.start_at);
      const end = new Date(schedule.end_at);

      // Currently rented
      if (now >= start && now <= end) {
        isRented = true;
        // availableFrom = end of current rental
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
