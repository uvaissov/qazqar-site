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

  if (!user?.clientId) return 0;

  const requests = await yumeApi.getAllClientRequests(user.clientId);

  let synced = 0;
  for (const req of requests) {
    const firstInv = req.inventories[0];
    if (!firstInv) continue;

    const car = await prisma.car.findUnique({
      where: { inventoryId: firstInv.inventory },
    });
    if (!car) continue;

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

    // Fetch cancellation reason from CRM comments if missing
    if (status === "CANCELLED" && !existing?.cancellationReason) {
      try {
        const comments = await yumeApi.getRequestComments(req.id);
        const reason = comments
          .filter((c) => c.body)
          .map((c) => c.body)
          .join("; ");
        if (reason) {
          await prisma.booking.updateMany({
            where: { requestId: req.id },
            data: { cancellationReason: reason },
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

  return synced;
}
