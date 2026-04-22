import { yumeApi } from "@/lib/yume/api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint — remove after investigation
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const action = request.nextUrl.searchParams.get("action");

  // Probe: список инвентаризаций заявки (state, checked и т.п.).
  //   /api/debug-crm?action=inv-list&id=<requestId>
  if (action === "inv-list") {
    if (!id) return NextResponse.json({ error: "pass ?id=<requestId>" }, { status: 400 });
    const invs = await yumeApi.listInventorizationsForRequest(Number(id));
    return NextResponse.json({ count: invs.length, items: invs });
  }

  // Probe: существующие фото инвентаризаций.
  //   /api/debug-crm?action=inv-images&id=<invId>[,invId2]
  if (action === "inv-images") {
    if (!id) return NextResponse.json({ error: "pass ?id=<invId>[,invId2]" }, { status: 400 });
    const ids = id.split(",").map((s) => Number(s.trim())).filter(Boolean);
    const images = await yumeApi.getInventorizationImages(ids);
    return NextResponse.json({ count: images.length, items: images });
  }

  if (!id) return NextResponse.json({ error: "pass ?id=955" }, { status: 400 });

  if (action === "comments") {
    // Raw request to see actual response structure
    const comments = await yumeApi.getRequestComments(Number(id));
    return new Response(JSON.stringify(comments), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "docs") {
    const docs = await yumeApi.getRequestDocuments(Number(id));
    return NextResponse.json(docs);
  }

  if (action === "db") {
    const booking = await prisma.booking.findUnique({
      where: { requestId: Number(id) },
    });
    return NextResponse.json({
      id: booking?.id,
      requestId: booking?.requestId,
      status: booking?.status,
      hasDocuments: booking?.documents !== null && booking?.documents !== undefined,
      documentsType: typeof booking?.documents,
      documentsValue: booking?.documents,
      allKeys: booking ? Object.keys(booking) : [],
    });
  }

  const raw = await yumeApi.getRequest(Number(id));
  return NextResponse.json(raw);
}

// Probe: тест multipart upload фото в Yume.
//   POST /api/debug-crm  (multipart)  fields:
//     image=<file>   — картинка
//     mode=upload-only | upload-and-attach
//     requestId=<int>    (нужен для upload-and-attach)
//     inventoryId=<int>  (нужен для upload-and-attach)
// Возвращает raw-ответ CRM, чтобы убедиться в формате.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const image = form.get("image");
  const mode = (form.get("mode") as string) || "upload-only";

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "pass 'image' file" }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const uploaded = await yumeApi.uploadAttachmentImage(
    buffer,
    image.name,
    image.type,
    { contentType: "inventorization" }
  );

  if (mode !== "upload-and-attach") {
    return NextResponse.json({ uploaded });
  }

  const requestId = Number(form.get("requestId"));
  const inventoryId = Number(form.get("inventoryId"));
  if (!requestId || !inventoryId) {
    return NextResponse.json(
      { error: "requestId + inventoryId required for upload-and-attach" },
      { status: 400 }
    );
  }

  const inv = await yumeApi.createInventorization({
    request: requestId,
    inventory: inventoryId,
    state: Number(process.env.YUME_INVENTORIZATION_STATE_OK || 1),
    body: "debug probe via /api/debug-crm",
    images: [uploaded.id],
  });

  return NextResponse.json({ uploaded, inventorization: inv });
}
