import { requireAdmin } from "@/lib/auth";
import { getSyncStatus, syncCars } from "@/lib/yume/sync";
import { NextResponse } from "next/server";

// GET — sync status
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getSyncStatus());
}

// POST — force sync
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncCars();
    return NextResponse.json(getSyncStatus());
  } catch (error) {
    console.error("Manual sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
