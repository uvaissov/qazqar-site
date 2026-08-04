import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { compare, hash } from "bcryptjs";
import { normalizePhone } from "@/lib/phone";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { firstName: true, lastName: true, email: true, phone: true },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { firstName, lastName, phone, currentPassword, newPassword } =
      await request.json();

    const updateData: Record<string, string> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    // Резидентность в теле запроса не приходит — берём из профиля, иначе
    // нерезиденту с иностранным номером не дали бы сохранить свой телефон.
    if (phone) {
      const owner = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { isResident: true },
      });
      const phoneResult = normalizePhone(phone, {
        resident: owner?.isResident !== false,
      });
      if (!phoneResult.ok) {
        return NextResponse.json({ error: phoneResult.error }, { status: 400 });
      }
      updateData.phone = phoneResult.phone;
    } else {
      updateData.phone = null as unknown as string;
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      const valid = await compare(currentPassword, user!.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "WRONG_PASSWORD" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hash(newPassword, 12);
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
