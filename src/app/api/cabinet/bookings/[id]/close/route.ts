import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/minio";
import { yumeApi } from "@/lib/yume/api";
import { NextRequest, NextResponse } from "next/server";

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Parse multipart form data
    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];
    const comment = formData.get("comment") as string | null;

    // Validate photos
    if (!photos.length) {
      return NextResponse.json(
        { error: "At least 1 photo is required" },
        { status: 400 }
      );
    }

    if (photos.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed` },
        { status: 400 }
      );
    }

    for (const photo of photos) {
      if (!(photo instanceof File)) {
        return NextResponse.json(
          { error: "Invalid file in photos" },
          { status: 400 }
        );
      }
      if (!photo.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File "${photo.name}" is not an image` },
          { status: 400 }
        );
      }
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${photo.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }
    }

    // Find booking and verify ownership (by userId OR shared clientId)
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: { select: { clientId: true } } },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { clientId: true },
    });
    const ownedByClient =
      currentUser?.clientId != null &&
      booking?.user.clientId === currentUser.clientId;
    if (!booking || (booking.userId !== session.userId && !ownedByClient)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (booking.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active bookings can be closed" },
        { status: 400 }
      );
    }

    // Upload photos to MinIO
    const uploadedPaths: string[] = [];
    const timestamp = Date.now();

    for (const photo of photos) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const sanitizedName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `bookings/${id}/${timestamp}-${sanitizedName}`;
      await uploadFile(buffer, fileName, photo.type);
      uploadedPaths.push(fileName);
    }

    // Update booking status to COMPLETED with documents
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        documents: uploadedPaths,
        ...(comment && { comment }),
      },
      select: {
        id: true,
        status: true,
        documents: true,
      },
    });

    // Sync with Yume CRM (non-blocking)
    if (booking.requestId) {
      try {
        await yumeApi.addRequestComment(
          booking.requestId,
          `Booking closed by client.${comment ? ` Comment: ${comment}` : ""}`
        );
      } catch (err) {
        console.error("[Yume] Failed to update request on close:", err);
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("[BookingClose] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
