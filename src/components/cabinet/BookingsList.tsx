"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

type Booking = {
  id: string;
  carName: string;
  carSlug: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  discountPercent: number;
  status: string;
  comment: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function BookingsList({ bookings }: { bookings: Booking[] }) {
  const t = useTranslations("cabinet");
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm(t("confirmCancel"))) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/cabinet/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setCancelling(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">{t("noBookings")}</p>
        <Link
          href="/catalog"
          className="mt-4 inline-block rounded-lg bg-cyan-500 px-6 py-2.5 font-medium text-white hover:bg-cyan-600"
        >
          {t("browseCars")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const start = new Date(booking.startDate).toLocaleDateString("ru-RU");
        const end = new Date(booking.endDate).toLocaleDateString("ru-RU");

        return (
          <div
            key={booking.id}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Link href={`/catalog/${booking.carSlug}`} className="font-semibold text-gray-900 hover:text-cyan-600">
                    {booking.carName}
                  </Link>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}>
                    {t(`status_${booking.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{start} — {end}</p>
                {booking.comment && (
                  <p className="mt-1 text-sm text-gray-400">{booking.comment}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {booking.totalPrice.toLocaleString()} ₸
                </p>
                {booking.discountPercent > 0 && (
                  <p className="text-xs text-green-600">-{booking.discountPercent}%</p>
                )}
              </div>
            </div>

            {booking.status === "PENDING" && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancelling === booking.id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {cancelling === booking.id ? "..." : t("cancelBooking")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
