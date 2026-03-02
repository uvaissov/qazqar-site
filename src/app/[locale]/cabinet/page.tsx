import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import ProfileForm from "@/components/cabinet/ProfileForm";

export default async function CabinetProfilePage() {
  const session = await getSession();
  const t = await getTranslations("cabinet");

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    select: { firstName: true, lastName: true, email: true, phone: true },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{t("profile")}</h2>
      <ProfileForm user={user!} />
    </div>
  );
}
