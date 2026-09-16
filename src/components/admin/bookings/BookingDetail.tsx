"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { X, Check } from "lucide-react";
import { formatPhone } from "@/lib/phone";

const CRM_BASE_URL = "https://qazqar.yume.cloud/orders";

interface BookingWithCar {
  id: string;
  requestId: number | null;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  discountPercent: number;
  status: string;
  comment: string | null;
  depositAmount: number | null;
  depositLabel: string | null;
  withDeposit: boolean;
  createdAt: string;
  updatedAt: string;
  car: {
    id: string;
    year: number;
    number: string;
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

type AlternativeCar = {
  id: string;
  number: string;
  color: string;
  year: number;
  image: string | null;
};

/** Пока авто не выдано — совпадает с CAR_CHANGEABLE_STATUSES на бэке. */
const CAR_CHANGEABLE_STATUSES = ["PENDING", "CONFIRMED"];

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  RETURN_PENDING: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function BookingDetail({ booking }: BookingDetailProps) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";
  const router = useRouter();

  // Смена авто: список свободных машин той же группы → PATCH .../car
  const [changeCarOpen, setChangeCarOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeCar[] | null>(null);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [changingCar, setChangingCar] = useState(false);
  const [changeCarError, setChangeCarError] = useState<string | null>(null);
  const canChangeCar = CAR_CHANGEABLE_STATUSES.includes(booking.status);

  async function openChangeCar() {
    setChangeCarOpen(true);
    setAlternatives(null);
    setSelectedCar(null);
    setChangeCarError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/alternatives`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { cars: AlternativeCar[] };
      setAlternatives(data.cars);
    } catch {
      setAlternatives([]);
      setChangeCarError(t("changeCarLoadError"));
    }
  }

  function closeChangeCar() {
    if (changingCar) return;
    setChangeCarOpen(false);
  }

  async function handleChangeCar() {
    if (!selectedCar) return;
    setChangingCar(true);
    setChangeCarError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/car`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: selectedCar }),
      });
      if (res.ok) {
        setChangingCar(false);
        setChangeCarOpen(false);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setChangeCarError(
        data.error === "CAR_UNAVAILABLE"
          ? t("changeCarTaken")
          : data.error === "CRM_ERROR"
            ? t("changeCarCrmError")
            : t("changeCarError")
      );
    } catch {
      setChangeCarError(t("changeCarError"));
    } finally {
      setChangingCar(false);
    }
  }

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: t("pending"),
      CONFIRMED: t("confirmed"),
      ACTIVE: t("active"),
      RETURN_PENDING: t("returnPending"),
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

  const days = getDaysCount();
  const basePrice = getBasePrice();

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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("bookingInfo")}
          </h2>
          <div className="flex items-center gap-3">
            {booking.requestId != null && (
              <a
                href={`${CRM_BASE_URL}/${booking.requestId}/all`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                title="Открыть в Yume CRM"
              >
                CRM #{booking.requestId}
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
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-7.5 3L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_BADGE_STYLES[booking.status] ||
                "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabel(booking.status)}
            </span>
          </div>
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
                <p className="mt-1 text-gray-900">{formatPhone(booking.customerPhone)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("car")}
                </label>
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/cars/${booking.car.id}/edit`}
                    className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    {booking.car.model.brand.name} {booking.car.model.name}{" "}
                    {booking.car.year}
                  </Link>
                  <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                    {booking.car.number}
                  </span>
                </p>
                {canChangeCar && (
                  <button
                    type="button"
                    onClick={openChangeCar}
                    className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    {t("changeCar")}
                  </button>
                )}
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
              {booking.depositAmount != null && booking.depositAmount > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Депозит
                  </label>
                  <p className="mt-1 text-gray-900 font-medium">
                    {booking.depositLabel || (booking.withDeposit ? "С депозитом" : "Без депозита")}
                    {" — "}
                    <span className={booking.withDeposit ? "text-blue-600" : "text-amber-600"}>
                      {booking.depositAmount.toLocaleString()} &#8376;
                    </span>
                  </p>
                </div>
              )}
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

      </div>

      {/* Change car modal */}
      {changeCarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeChangeCar}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t("changeCarTitle")}</h3>
              <button onClick={closeChangeCar} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              {t("changeCarHint")} {t("changeCarCurrent")}: <span className="font-mono">{booking.car.number}</span>
            </p>

            {alternatives === null ? (
              <p className="py-6 text-center text-sm text-gray-400">{t("changeCarLoading")}</p>
            ) : alternatives.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">{t("changeCarEmpty")}</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {alternatives.map((car) => (
                  <button
                    key={car.id}
                    onClick={() => setSelectedCar(car.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selectedCar === car.id
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {car.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={car.image} alt={car.number} className="h-12 w-16 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-16 shrink-0 rounded bg-gray-100" />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-gray-900">{car.number}</p>
                      <p className="text-xs text-gray-500">{car.year} · {car.color}</p>
                    </div>
                    {selectedCar === car.id && <Check size={18} className="ml-auto shrink-0 text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}

            {changeCarError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{changeCarError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeChangeCar}
                disabled={changingCar}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleChangeCar}
                disabled={!selectedCar || changingCar}
                className="flex-1 rounded-lg bg-cyan-600 py-2.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {changingCar ? "..." : t("changeCarConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
