import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserBookings } from "@/lib/yume/sync-bookings";
import { yumeApi } from "@/lib/yume/api";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import BookingsList from "@/components/cabinet/BookingsList";

function mapDocuments(docs: Awaited<ReturnType<typeof yumeApi.getRequestDocuments>>): BookingDocument[] {
  return docs.map((doc) => {
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
}

export default async function CabinetBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const t = await getTranslations("cabinet");

  // Sync bookings from CRM before displaying
  await syncUserBookings(session.userId).catch(() => {});

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { clientId: true },
  });

  const bookings = await prisma.booking.findMany({
    where: currentUser?.clientId
      ? { user: { clientId: currentUser.clientId } }
      : { userId: session.userId },
    include: {
      car: {
        include: {
          model: { include: { brand: true } },
          photos: {
            include: { photo: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [
      { requestId: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  // Fetch documents on-demand from CRM for CONFIRMED/ACTIVE bookings, save to DB
  const docsMap: Record<string, BookingDocument[]> = {};
  const bookingsWithDocs = bookings.filter(
    (b) => b.requestId && ["CONFIRMED", "ACTIVE"].includes(b.status)
  );
  await Promise.all(
    bookingsWithDocs.map(async (b) => {
      try {
        const docs = await yumeApi.getRequestDocuments(b.requestId!);
        const mapped = mapDocuments(docs);
        docsMap[b.id] = mapped;
        // Save to DB cache (fire-and-forget)
        prisma.booking.update({
          where: { id: b.id },
          data: { documents: mapped as unknown as Record<string, unknown>[] },
        }).catch(() => {});
      } catch {
        // CRM unavailable — use cached from DB
        docsMap[b.id] = (b.documents as BookingDocument[] | null) || [];
      }
    })
  );

  // Serialize for client component
  const serialized = bookings.map((b) => ({
    id: b.id,
    carName: `${b.car.model.brand.name} ${b.car.model.name}`,
    carImage: b.car.photos[0]?.photo.url || null,
    carSlug: b.car.slug,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    totalPrice: b.totalPrice,
    discountPercent: b.discountPercent,
    status: b.status,
    comment: b.comment,
    cancellationReason: b.cancellationReason,
    depositAmount: b.depositAmount,
    depositLabel: b.depositLabel,
    withDeposit: b.withDeposit,
    documents: docsMap[b.id] || [],
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{t("bookings")}</h2>
      <BookingsList bookings={serialized} />
    </div>
  );
}

type BookingDocument = {
  name: string;
  allSigned: boolean;
  partiallySigned: boolean;
  docUrl: string;
  signers: { name: string; type: string; signed: boolean; signUrl: string }[];
};
