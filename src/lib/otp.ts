import { prisma } from "@/lib/prisma";
import type { OtpType } from "@/generated/prisma/enums";

const OTP_TTL_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(
  email: string,
  type: OtpType
): Promise<{ code: string } | { error: string }> {
  // Rate limit: check last OTP for this email+type
  const recent = await prisma.otpCode.findFirst({
    where: { email, type, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (elapsed < OTP_COOLDOWN_SECONDS) {
      return {
        error: `Подождите ${Math.ceil(OTP_COOLDOWN_SECONDS - elapsed)} сек.`,
      };
    }
  }

  // Invalidate previous unused OTPs
  await prisma.otpCode.updateMany({
    where: { email, type, used: false },
    data: { used: true },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { email, code, type, expiresAt },
  });

  return { code };
}

export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}
