import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSection } from "@/lib/auth";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSection("users");

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Создать сотрудника (MANAGER или ADMIN). Только админ: клиенты
 * регистрируются сами, а роли раздаёт админ. Логин — по email и паролю,
 * как у обычного пользователя; CRM-клиент сотруднику не нужен.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = body?.role;

  if (!firstName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
  }
  if (role !== "MANAGER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash: await hash(password, 12),
      role,
      isResident: true,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
