"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";

interface BookingWithCar {
  id: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  discountPercent: number;
  status: string;
  comment: string | null;
  createdAt: string;
  car: {
    id: string;
    year: number;
    model: {
      name: string;
      brand: {
        name: string;
      };
    };
  };
}

interface StatusCounts {
  all: number;
  PENDING: number;
  CONFIRMED: number;
  ACTIVE: number;
  COMPLETED: number;
  CANCELLED: number;
}

interface BookingsListProps {
  bookings: BookingWithCar[];
  counts: StatusCounts;
  currentStatus: string | null;
}

const STATUS_TABS = [
  { key: "all", value: null },
  { key: "pending", value: "PENDING" },
  { key: "confirmed", value: "CONFIRMED" },
  { key: "active", value: "ACTIVE" },
  { key: "completed", value: "COMPLETED" },
  { key: "cancelled", value: "CANCELLED" },
] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function BookingsList({
  bookings,
  counts,
  currentStatus,
}: BookingsListProps) {
  const t = useTranslations("adminBookings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabClick = (statusValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusValue) {
      params.set("status", statusValue);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getCountForTab = (tab: (typeof STATUS_TABS)[number]) => {
    if (tab.value === null) return counts.all;
    return counts[tab.value];
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: t("pending"),
      CONFIRMED: t("confirmed"),
      ACTIVE: t("active"),
      COMPLETED: t("completed"),
      CANCELLED: t("cancelled"),
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t(tab.key)}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {getCountForTab(tab)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings table */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          <p className="text-gray-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("client")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("phone")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("car")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("dates")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("total")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("status")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    {t("created")}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {booking.customerName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.customerPhone}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.car.model.brand.name} {booking.car.model.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-xs">
                        {formatDate(booking.startDate)} —{" "}
                        {formatDate(booking.endDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.totalPrice.toLocaleString()} &#8376;
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE_STYLES[booking.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {t("details")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
