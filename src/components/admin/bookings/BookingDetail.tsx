"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
  updatedAt: string;
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

interface BookingDetailProps {
  booking: BookingWithCar;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

type StatusAction = {
  label: string;
  targetStatus: string;
  style: string;
};

export default function BookingDetail({ booking }: BookingDetailProps) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysCount = () => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBasePrice = () => {
    if (booking.discountPercent > 0) {
      return Math.round(booking.totalPrice / (1 - booking.discountPercent / 100));
    }
    return booking.totalPrice;
  };

  const getStatusActions = (): StatusAction[] => {
    switch (booking.status) {
      case "PENDING":
        return [
          {
            label: t("confirm"),
            targetStatus: "CONFIRMED",
            style: "bg-blue-500 hover:bg-blue-600 text-white",
          },
          {
            label: t("cancel"),
            targetStatus: "CANCELLED",
            style: "bg-red-500 hover:bg-red-600 text-white",
          },
        ];
      case "CONFIRMED":
        return [
          {
            label: t("activate"),
            targetStatus: "ACTIVE",
            style: "bg-green-500 hover:bg-green-600 text-white",
          },
          {
            label: t("cancel"),
            targetStatus: "CANCELLED",
            style: "bg-red-500 hover:bg-red-600 text-white",
          },
        ];
      case "ACTIVE":
        return [
          {
            label: t("complete"),
            targetStatus: "COMPLETED",
            style: "bg-gray-600 hover:bg-gray-700 text-white",
          },
        ];
      default:
        return [];
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Status change failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const days = getDaysCount();
  const basePrice = getBasePrice();
  const actions = getStatusActions();

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        {t("back")}
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("bookingInfo")}
          </h2>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_BADGE_STYLES[booking.status] ||
              "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabel(booking.status)}
          </span>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client info */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("client")}
                </label>
                <p className="mt-1 text-gray-900 font-medium">
                  {booking.customerName}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("phone")}
                </label>
                <p className="mt-1 text-gray-900">{booking.customerPhone}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("car")}
                </label>
                <p className="mt-1">
                  <Link
                    href={`/admin/cars/${booking.car.id}/edit`}
                    className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    {booking.car.model.brand.name} {booking.car.model.name}{" "}
                    {booking.car.year}
                  </Link>
                </p>
              </div>
            </div>

            {/* Booking details */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("dates")}
                </label>
                <p className="mt-1 text-gray-900">
                  {formatDate(booking.startDate)} —{" "}
                  {formatDate(booking.endDate)}
                  <span className="text-gray-500 ml-2">
                    ({days} {t("days")})
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("total")}
                </label>
                <p className="mt-1 text-gray-900 font-semibold text-lg">
                  {booking.totalPrice.toLocaleString()} &#8376;
                </p>
                {booking.discountPercent > 0 && (
                  <div className="mt-1 text-sm text-gray-500">
                    <span>
                      {t("basePrice")}: {basePrice.toLocaleString()} &#8376;
                    </span>
                    <span className="ml-3 text-green-600">
                      {t("discount")}: -{booking.discountPercent}%
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("comment")}
                </label>
                <p className="mt-1 text-gray-600">
                  {booking.comment || (
                    <span className="italic text-gray-400">
                      {t("noComment")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
            <span>
              {t("created")}: {formatDateTime(booking.createdAt)}
            </span>
            <span>
              Updated: {formatDateTime(booking.updatedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            {actions.map((action) => (
              <button
                key={action.targetStatus}
                onClick={() => handleStatusChange(action.targetStatus)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${action.style}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
