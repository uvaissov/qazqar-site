import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/minio";
import { yumeApi } from "@/lib/yume/api";
import { NextRequest, NextResponse } from "next/server";

const MAX_MANDATORY_PHOTOS = 4;
const MAX_DAMAGE_PHOTOS = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 512;

const STATE_OK = Number(process.env.YUME_INVENTORIZATION_STATE_OK || 1);
const STATE_BROKEN = Number(process.env.YUME_INVENTORIZATION_STATE_BROKEN || 2);

function validatePhotos(label: string, files: File[], maxCount: number) {
  if (files.length > maxCount) {
    return `Maximum ${maxCount} ${label} photos allowed`;
  }
  for (const f of files) {
    if (!(f instanceof File)) return `Invalid file in ${label}`;
    if (!f.type.startsWith("image/")) return `File "${f.name}" is not an image`;
    if (f.size > MAX_FILE_SIZE) return `File "${f.name}" exceeds 10MB limit`;
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];
    const damagePhotos = formData.getAll("damagePhotos") as File[];
    const commentRaw = formData.get("comment");
    const comment =
      typeof commentRaw === "string" && commentRaw.trim().length
        ? commentRaw.trim().slice(0, MAX_COMMENT_LENGTH)
        : null;

    if (photos.length < MAX_MANDATORY_PHOTOS) {
      return NextResponse.json(
        { error: `At least ${MAX_MANDATORY_PHOTOS} mandatory photos are required` },
        { status: 400 }
      );
    }

    const mandatoryErr = validatePhotos("mandatory", photos, MAX_MANDATORY_PHOTOS);
    if (mandatoryErr) return NextResponse.json({ error: mandatoryErr }, { status: 400 });
    const damageErr = validatePhotos("damage", damagePhotos, MAX_DAMAGE_PHOTOS);
    if (damageErr) return NextResponse.json({ error: damageErr }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { clientId: true } },
        car: { select: { inventoryId: true, hasRemote: true } },
      },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { clientId: true },
    });
    const ownedByClient =
      currentUser?.clientId != null &&
      booking?.user?.clientId === currentUser.clientId;
    if (!booking || (booking.userId !== session.userId && !ownedByClient)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Only confirmed bookings can be picked up" },
        { status: 400 }
      );
    }

    if (!booking.car.hasRemote) {
      return NextResponse.json(
        { error: "Car does not support self-pickup" },
        { status: 403 }
      );
    }

    if (!booking.requestId) {
      return NextResponse.json(
        { error: "Booking is not linked to a CRM request" },
        { status: 400 }
      );
    }

    if (!booking.car.inventoryId) {
      return NextResponse.json(
        { error: "Car is not linked to a CRM inventory" },
        { status: 400 }
      );
    }

    type Prepared = { buffer: Buffer; name: string; type: string; isDamage: boolean };
    const prepared: Prepared[] = [];
    for (const p of photos) {
      prepared.push({
        buffer: Buffer.from(await p.arrayBuffer()),
        name: p.name,
        type: p.type,
        isDamage: false,
      });
    }
    for (const p of damagePhotos) {
      prepared.push({
        buffer: Buffer.from(await p.arrayBuffer()),
        name: p.name,
        type: p.type,
        isDamage: true,
      });
    }

    const uploadedPaths: string[] = [];
    const timestamp = Date.now();
    for (const p of prepared) {
      const sanitizedName = p.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `bookings/${id}/pickup/${timestamp}-${sanitizedName}`;
      await uploadFile(p.buffer, fileName, p.type);
      uploadedPaths.push(fileName);
    }

    try {
      const state = damagePhotos.length > 0 ? STATE_BROKEN : STATE_OK;
      const body = comment
        ? `Выдача клиентом. ${comment}`.slice(0, MAX_COMMENT_LENGTH)
        : "Выдача клиентом через мобильное приложение";

      const inventorization = await yumeApi.createInventorization({
        request: booking.requestId,
        inventory: booking.car.inventoryId,
        state,
        body,
      });

      for (const p of prepared) {
        await yumeApi.uploadAttachmentImage(
          p.buffer,
          p.name,
          p.type,
          { contentType: "inventorization", objectId: inventorization.id }
        );
      }

      await yumeApi.startRental(booking.requestId, booking.car.inventoryId);
    } catch (err) {
      console.error("[BookingPickup] CRM inventorization failed:", err);
      return NextResponse.json(
        {
          error:
            "Не удалось отправить отчёт в CRM. Попробуйте ещё раз через пару минут.",
        },
        { status: 502 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "ACTIVE",
        pickupDocuments: uploadedPaths,
        ...(comment && { comment }),
      },
      select: {
        id: true,
        status: true,
        pickupDocuments: true,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("[BookingPickup] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
