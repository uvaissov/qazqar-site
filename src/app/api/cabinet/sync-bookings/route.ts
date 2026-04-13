import { getSession } from "@/lib/auth";
import { syncUserBookings } from "@/lib/yume/sync-bookings";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const synced = await syncUserBookings(session.userId);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error("Sync bookings error:", error);
    return NextResponse.json(
      { error: "Failed to sync bookings" },
      { status: 500 }
    );
  }
}
