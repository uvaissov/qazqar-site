"use client";

import Link from "next/link";
import type { DashboardBooking } from "./types";

const CRM_URL = "https://qazqar.yume.cloud/orders";

export function DashboardCard({ booking }: { booking: DashboardBooking }) {
  const carLabel = booking.car
    ? [
        booking.car.brand,
        booking.car.modelName,
        booking.car.number ? `· ${booking.car.number}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "Авто не указано";

  const start = new Date(booking.startDate).toLocaleDateString("ru-RU");
  const end = new Date(booking.endDate).toLocaleDateString("ru-RU");
  const price = booking.totalPrice.toLocaleString("ru-RU");

  return (
    <div className="group flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-cyan-400 hover:shadow-sm transition">
      <Link
        href={`/admin/bookings/${booking.id}`}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p className="text-sm font-semibold text-gray-900 truncate">
          {booking.customerName || "—"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {booking.customerPhone || "—"}
        </p>
        <p className="text-xs text-gray-700 mt-1 truncate">{carLabel}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {start} → {end} · {price} ₸
        </p>
      </Link>

      {booking.requestId != null && (
        <a
          href={`${CRM_URL}/${booking.requestId}/all`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-medium text-cyan-600 hover:text-cyan-700 hover:underline whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
          title="Открыть в Yume CRM"
        >
          CRM →
        </a>
      )}
    </div>
  );
}
