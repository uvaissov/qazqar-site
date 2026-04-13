import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true },
    });

    return NextResponse.json({ exists: !!user, firstName: user?.firstName || null });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
