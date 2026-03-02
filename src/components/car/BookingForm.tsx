"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

type Discount = {
  id: string;
  minDays: number;
  maxDays: number;
  percent: number;
};

type BookingFormProps = {
  carId: string;
  pricePerDay: number;
  discounts: Discount[];
};

export default function BookingForm({
  carId,
  pricePerDay,
  discounts,
}: BookingFormProps) {
  const t = useTranslations("booking");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user.id);
          if (!name) setName(`${data.user.firstName} ${data.user.lastName}`);
          if (!phone && data.user.phone) setPhone(data.user.phone);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const calculation = useMemo(() => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) return null;

    const basePrice = days * pricePerDay;

    const applicable = discounts.find(
      (d) => days >= d.minDays && days <= d.maxDays
    );
    const discountPercent = applicable?.percent ?? 0;
    const totalPrice = Math.round(basePrice * (1 - discountPercent / 100));

    return { days, basePrice, discountPercent, totalPrice };
  }, [startDate, endDate, pricePerDay, discounts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          customerName: name,
          customerPhone: phone,
          startDate,
          endDate,
          comment: comment || undefined,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error"));
        return;
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setStartDate("");
      setEndDate("");
      setComment("");
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t("title")}</h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          {t("success")}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="booking-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("name")} *
          </label>
          <input
            id="booking-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="booking-phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("phone")} *
          </label>
          <input
            id="booking-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        {/* Start date */}
        <div>
          <label
            htmlFor="booking-start"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("startDate")} *
          </label>
          <input
            id="booking-start"
            type="date"
            required
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        {/* End date */}
        <div>
          <label
            htmlFor="booking-end"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("endDate")} *
          </label>
          <input
            id="booking-end"
            type="date"
            required
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        {/* Price calculation */}
        {calculation && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {calculation.days} {t("days")}
              </span>
              <span>
                {t("basePrice")}: {calculation.basePrice.toLocaleString()} ₸
              </span>
            </div>
            {calculation.discountPercent > 0 && (
              <div className="flex justify-between text-cyan-600 font-medium">
                <span>
                  {t("discount")} {calculation.discountPercent}%
                </span>
                <span>
                  -
                  {(
                    calculation.basePrice - calculation.totalPrice
                  ).toLocaleString()}{" "}
                  ₸
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-200">
              <span>{t("total")}</span>
              <span>{calculation.totalPrice.toLocaleString()} ₸</span>
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <label
            htmlFor="booking-comment"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("comment")}
          </label>
          <textarea
            id="booking-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : t("submit")}
        </button>
      </form>
    </div>
  );
}
