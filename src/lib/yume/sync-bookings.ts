import { prisma } from "@/lib/prisma";
import { yumeApi } from "./api";

const STATUS_MAP: Record<string, string> = {
  request: "PENDING",
  reserve: "CONFIRMED",
  inrent: "ACTIVE",
  exceed: "ACTIVE",
  completed: "COMPLETED",
  debtor: "COMPLETED",
  cancelled: "CANCELLED",
  cancel: "CANCELLED",
};

export async function syncUserBookings(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clientId: true },
  });

  if (!user?.clientId) {
    console.log(`[SyncBookings] user ${userId}: no clientId, skipping`);
    return 0;
  }

  const requests = await yumeApi.getAllClientRequests(user.clientId);
  console.log(
    `[SyncBookings] clientId=${user.clientId}: fetched ${requests.length} CRM requests`
  );

  let synced = 0;
  let skippedNoInv = 0;
  let skippedNoCar = 0;
  for (const req of requests) {
    const firstInv = req.inventories[0];
    if (!firstInv) {
      skippedNoInv++;
      console.log(
        `[SyncBookings] CRM #${req.id} (status=${req.status_color}): no inventories attached, skipping`
      );
      continue;
    }

    const car = await prisma.car.findUnique({
      where: { inventoryId: firstInv.inventory },
    });
    if (!car) {
      skippedNoCar++;
      console.log(
        `[SyncBookings] CRM #${req.id}: car inventoryId=${firstInv.inventory} (${firstInv.inventory_name} ${firstInv.inventory_car_number}) not in local DB, skipping`
      );
      continue;
    }

    const status = STATUS_MAP[req.status_color] || "PENDING";

    // Fetch documents for confirmed/active bookings
    let documents: unknown | undefined;
    if (["CONFIRMED", "ACTIVE"].includes(status)) {
      try {
        const docs = await yumeApi.getRequestDocuments(req.id);
        console.log(`[SyncBookings] CRM #${req.id}: ${docs.length} docs fetched`);
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
          return { name: doc.name.replace(/ - \d+$/, ""), allSigned, partiallySigned, docUrl, signers };
        });
      } catch {
        // CRM unavailable — keep existing
      }
    }

    const existing = await prisma.booking.findUnique({
      where: { requestId: req.id },
    });

    // Don't overwrite locally cancelled bookings until CRM catches up
    if (existing?.status === "CANCELLED" && status !== "CANCELLED") {
      continue;
    }

    // Local RETURN_PENDING always waits for explicit manager approval in CRM
    // (inventorization.checked = true). Do NOT fall through to the upsert below
    // even if CRM status reports "completed" — manager may still reject the return.
    // Local RETURN_PENDING waits for CRM request to transition to "completed"
    // (manager finalises the rental in Yume after reviewing return photos).
    // Yume auto-sets inventorization.checked=true on API-created records, so
    // it cannot be used as an approval signal — we track request.status_color.
    if (existing?.status === "RETURN_PENDING") {
      if (status === "COMPLETED") {
        await prisma.booking.update({
          where: { id: existing.id },
          data: { status: "COMPLETED" },
        });
        synced++;
        console.log(
          `[SyncBookings] CRM #${req.id}: status_color=${req.status_color} → COMPLETED`
        );
      } else {
        console.log(
          `[SyncBookings] CRM #${req.id}: RETURN_PENDING held (crmStatus=${req.status_color})`
        );
      }
      continue;
    }

    // Fetch cancellation reason only on transition to CANCELLED (or first sync of an already-cancelled request)
    const becameCancelled =
      status === "CANCELLED" && existing?.status !== "CANCELLED";
    if (becameCancelled) {
      try {
        const [comments, serviceUserId] = await Promise.all([
          yumeApi.getRequestComments(req.id),
          yumeApi.getServiceUserId(),
        ]);
        const latest = comments
          .filter((c) => c.body && c.user !== serviceUserId)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )[0];
        if (latest?.body) {
          await prisma.booking.updateMany({
            where: { requestId: req.id },
            data: { cancellationReason: latest.body },
          });
        }
      } catch {
        // CRM unavailable
      }
    }

    await prisma.booking.upsert({
      where: { requestId: req.id },
      update: {
        startDate: new Date(req.rent_start),
        endDate: new Date(req.rent_end),
        totalPrice: Math.round(parseFloat(req.price)),
        status,
        ...(documents !== undefined && { documents }),
      },
      create: {
        requestId: req.id,
        userId: user.id,
        carId: car.id,
        startDate: new Date(req.rent_start),
        endDate: new Date(req.rent_end),
        totalPrice: Math.round(parseFloat(req.price)),
        discountPercent:
          req.price !== req.price_discount
            ? Math.round(
                (1 - parseFloat(req.price_discount) / parseFloat(req.price)) * 100
              )
            : 0,
        status,
        customerName: req.client.name,
        customerPhone: req.client.phone,
        ...(documents && { documents }),
      },
    });
    synced++;
  }

  console.log(
    `[SyncBookings] clientId=${user.clientId}: synced=${synced}, skippedNoInv=${skippedNoInv}, skippedNoCar=${skippedNoCar}`
  );
  return synced;
}
