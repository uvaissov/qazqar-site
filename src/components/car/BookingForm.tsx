"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Calendar, Send, Sparkles } from "lucide-react";

type Discount = {
  id: string;
  minDays: number;
  maxDays: number;
  percent: number;
};

type BookingFormProps = {
  carId: string;
  discounts: Discount[];
};

export default function BookingForm({
  carId,
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

    // TODO: цена будет приходить из тарифов API
    const basePrice = 0;

    const applicable = discounts.find(
      (d) => days >= d.minDays && days <= d.maxDays
    );
    const discountPercent = applicable?.percent ?? 0;
    const totalPrice = Math.round(basePrice * (1 - discountPercent / 100));

    return { days, basePrice, discountPercent, totalPrice };
  }, [startDate, endDate, discounts]);

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
    <div className="glass rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-cyan-100/20 relative overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 to-blue-600" />
      
      <div className="flex items-center gap-3 mb-6">
         <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5" />
         </div>
         <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t("title")}</h2>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-sm flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {t("success")}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {/* Name */}
           <div>
             <label
               htmlFor="booking-name"
               className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
             >
               {t("name")} *
             </label>
             <input
               id="booking-name"
               type="text"
               required
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900"
             />
           </div>

           {/* Phone */}
           <div>
             <label
               htmlFor="booking-phone"
               className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
             >
               {t("phone")} *
             </label>
             <input
               id="booking-phone"
               type="tel"
               required
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900"
             />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {/* Start date */}
           <div>
             <label
               htmlFor="booking-start"
               className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
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
               className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900 uppercase"
             />
           </div>

           {/* End date */}
           <div>
             <label
               htmlFor="booking-end"
               className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
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
               className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900 uppercase"
             />
           </div>
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="booking-comment"
            className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
          >
            {t("comment")}
          </label>
          <textarea
            id="booking-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900 resize-none"
          />
        </div>

        {/* Price calculation Bento Card */}
        {calculation && (
          <div className="bg-gray-900 text-white rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="flex justify-between items-center text-gray-400 text-sm mb-3 font-medium">
              <span>
                {calculation.days} {t("days")}
              </span>
              <span>
                {calculation.basePrice.toLocaleString()} ₸
              </span>
            </div>
            
            {calculation.discountPercent > 0 && (
              <div className="flex justify-between items-center text-cyan-400 text-sm mb-3 font-bold bg-cyan-950/50 p-2 rounded-lg">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
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
            
            <div className="flex justify-between items-end pt-4 border-t border-gray-800">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                 {t("total")}
              </span>
              <div className="text-right">
                 <span className="text-2xl font-black text-white">
                   {calculation.totalPrice.toLocaleString()} ₸
                 </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/30 mt-2"
        >
          {submitting ? "..." : (
            <>
               <Send className="w-5 h-5" />
               {t("submit")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
