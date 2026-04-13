import { requireAdmin } from "@/lib/auth";
import { yumeApi } from "@/lib/yume/api";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await yumeApi.getClient(Number(id));
    return NextResponse.json(client);
  } catch (error) {
    console.error("Get CRM client error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CRM client" },
      { status: 500 }
    );
  }
}
