import { getTranslations } from "next-intl/server";
import RemoteCommandsTable from "@/components/admin/sms-log/RemoteCommandsTable";

export default async function AdminSmsLogPage() {
  const t = await getTranslations("adminSmsLog");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <p className="text-sm text-gray-400 mb-4">{t("legacyNote")}</p>

      <RemoteCommandsTable showCar />
    </div>
  );
}
