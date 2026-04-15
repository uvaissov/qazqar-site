"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { X, FileText, Check, ExternalLink } from "lucide-react";

type DocumentSigner = {
  name: string;
  type: string; // "client" or company
  signed: boolean;
  signUrl: string;
};

type BookingDocument = {
  name: string;
  allSigned: boolean;
  partiallySigned: boolean;
  docUrl: string;
  signers: DocumentSigner[];
};

type Booking = {
  id: string;
  carName: string;
  carImage: string | null;
  carSlug: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  discountPercent: number;
  status: string;
  comment: string | null;
  cancellationReason: string | null;
  documents: BookingDocument[];
  createdAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusOrder: Record<string, number> = {
  ACTIVE: 0,
  CONFIRMED: 1,
  PENDING: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};

const REASON_PRESETS = [
  "reasonPlansChanged",
  "reasonFoundOther",
  "reasonPriceTooHigh",
] as const;

type Tab = "active" | "history";

export default function BookingsList({ bookings }: { bookings: Booking[] }) {
  const t = useTranslations("cabinet");
  const locale = useLocale();
  const dateLocale = locale === "kz" ? "kk-KZ" : "ru-RU";
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isOther, setIsOther] = useState(false);

  function openCancelModal(id: string) {
    setCancelModal(id);
    setSelectedPreset(null);
    setCustomReason("");
    setIsOther(false);
  }

  function closeCancelModal() {
    setCancelModal(null);
    setSelectedPreset(null);
    setCustomReason("");
    setIsOther(false);
  }

  function selectPreset(key: string) {
    setSelectedPreset(key);
    setIsOther(false);
    setCustomReason("");
  }

  function selectOther() {
    setSelectedPreset(null);
    setIsOther(true);
  }

  const cancelReason = isOther ? customReason.trim() : (selectedPreset ? t(selectedPreset) : "");
  const canSubmit = cancelReason.length > 0;

  async function handleCancel() {
    if (!cancelModal || !canSubmit) return;
    setCancelling(cancelModal);
    try {
      const res = await fetch(`/api/cabinet/bookings/${cancelModal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", reason: cancelReason }),
      });
      if (res.ok) {
        closeCancelModal();
        router.refresh();
      }
    } finally {
      setCancelling(null);
    }
  }

  const activeStatuses = ["PENDING", "CONFIRMED", "ACTIVE"];
  const activeBookings = bookings
    .filter((b) => activeStatuses.includes(b.status))
    .sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 5;
      const orderB = statusOrder[b.status] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const historyBookings = bookings
    .filter((b) => !activeStatuses.includes(b.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayed = tab === "active" ? activeBookings : historyBookings;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t("activeBookings")}
          {activeBookings.length > 0 && (
            <span className="ml-1.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700">
              {activeBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t("historyBookings")}
          {historyBookings.length > 0 && (
            <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
              {historyBookings.length}
            </span>
          )}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            {tab === "active" ? t("noActiveBookings") : t("noHistoryBookings")}
          </p>
          {tab === "active" && (
            <Link
              href="/catalog"
              className="mt-4 inline-block rounded-lg bg-cyan-500 px-6 py-2.5 font-medium text-white hover:bg-cyan-600"
            >
              {t("browseCars")}
            </Link>
          )}
        </div>
      ) : (
      <div className="space-y-4">
      {displayed.map((booking) => {
        const start = new Date(booking.startDate).toLocaleDateString(dateLocale);
        const end = new Date(booking.endDate).toLocaleDateString(dateLocale);

        return (
          <div
            key={booking.id}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start gap-4">
              {booking.carImage && (
                <Link href={`/catalog/${booking.carSlug}`} className="shrink-0">
                  <img
                    src={booking.carImage}
                    alt={booking.carName}
                    className="h-20 w-28 rounded-lg object-cover"
                  />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/catalog/${booking.carSlug}`} className="font-semibold text-gray-900 hover:text-cyan-600">
                    {booking.carName}
                  </Link>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}>
                    {t(`status_${booking.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{start} — {end}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-lg font-bold text-gray-900">
                    {booking.totalPrice.toLocaleString()} ₸
                  </p>
                  {booking.discountPercent > 0 && (
                    <p className="text-xs text-green-600">-{booking.discountPercent}%</p>
                  )}
                </div>
                {booking.comment && (
                  <p className="mt-1 text-sm text-gray-400">{booking.comment}</p>
                )}
                {booking.status === "CANCELLED" && booking.cancellationReason && (
                  <p className="mt-1 text-sm text-red-500">
                    {t("cancelReason")}: {booking.cancellationReason}
                  </p>
                )}
              </div>
            </div>

            {booking.documents.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-2 text-sm font-medium text-gray-700">{t("documents")}</p>
                <div className="space-y-3">
                  {booking.documents.map((doc, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText size={14} className="shrink-0 text-gray-400" />
                        {doc.allSigned ? (
                          <>
                            <span className="text-gray-800">{doc.name}</span>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                              {t("signed")}
                            </span>
                          </>
                        ) : (
                          <>
                            <a
                              href={doc.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700"
                            >
                              {doc.name} <ExternalLink size={12} />
                            </a>
                            {doc.partiallySigned ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                {t("partiallySigned")}
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                {t("notSigned")}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {doc.signers.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {doc.signers.map((signer, j) => {
                            const displayName = signer.type === "client" ? signer.name : t("company");
                            return (
                            <div key={j} className="flex items-center gap-2 text-xs">
                              {signer.signed ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Check size={12} />
                                  <span>{displayName}</span>
                                  <span className="text-green-500">— {t("signed")}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span className="inline-block h-3 w-3 rounded-full border border-gray-300" />
                                  <span>{displayName}</span>
                                  <span>—</span>
                                  {signer.type === "client" ? (
                                    <a
                                      href={signer.signUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700"
                                    >
                                      {t("sign")} <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span className="text-amber-600">{t("awaitingSign")}</span>
                                  )}
                                </span>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {booking.status === "PENDING" && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  onClick={() => openCancelModal(booking.id)}
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
      )}

      {/* Cancel reason modal */}
      {cancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeCancelModal}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("cancelReason")}
              </h3>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {REASON_PRESETS.map((key) => (
                <button
                  key={key}
                  onClick={() => selectPreset(key)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedPreset === key
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(key)}
                </button>
              ))}
              <button
                onClick={selectOther}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  isOther
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t("reasonOther")}
              </button>
            </div>

            {isOther && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none"
                rows={3}
                autoFocus
              />
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("back")}
              </button>
              <button
                onClick={handleCancel}
                disabled={!canSubmit || cancelling === cancelModal}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling === cancelModal ? "..." : t("confirmCancelAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
