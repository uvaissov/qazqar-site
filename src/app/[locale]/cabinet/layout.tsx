import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import CabinetNav from "@/components/cabinet/CabinetNav";
import LogoutButton from "@/components/cabinet/LogoutButton";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("cabinet");

  return (
    <div className="min-h-[60vh]">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{session!.email}</span>
              <LogoutButton />
            </div>
          </div>
          <CabinetNav />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
