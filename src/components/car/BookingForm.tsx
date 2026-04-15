"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertCircle, Calendar, Send, Sparkles } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ru } from "date-fns/locale/ru";
import { kk } from "date-fns/locale/kk";
import "react-datepicker/dist/react-datepicker.css";

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
  initialDateFrom?: string;
  initialDateTo?: string;
};

const TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  return `${String(i + 9).padStart(2, "0")}:00`;
});

function formatDateForAPI(d: Date, time: string): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${time}`;
}

export default function BookingForm({
  carId,
  pricePerDay,
  discounts,
  initialDateFrom,
  initialDateTo,
}: BookingFormProps) {
  const t = useTranslations("booking");
  const locale = useLocale();

  // Register locales for datepicker
  registerLocale("ru", ru);
  registerLocale("kk", kk);
  const dpLocale = locale === "kz" ? "kk" : "ru";

  function parseInitialDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T09:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [iin, setIin] = useState("");
  const [isResident, setIsResident] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(parseInitialDate(initialDateFrom));
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | null>(parseInitialDate(initialDateTo));
  const [endTime, setEndTime] = useState("09:00");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to result message
  useEffect(() => {
    if ((success || error) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [success, error]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showLoginBanner, setShowLoginBanner] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "otp" | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState("");

  async function checkEmail() {
    if (!email || isLoggedIn || !/\S+@\S+\.\S+/.test(email)) return;
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) {
        setEmailExists(true);
        setShowLoginBanner(true);
        if (data.firstName) setName(data.firstName);
      } else {
        setEmailExists(false);
        setShowLoginBanner(false);
        setLoginMode(null);
      }
    } catch {
      // ignore
    }
  }

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          if (!name) setName(`${data.user.firstName} ${data.user.lastName}`);
          if (!phone && data.user.phone) setPhone(data.user.phone);
          if (!email && data.user.email) setEmail(data.user.email);
          if (data.user.iin) setIin(data.user.iin);
          if (data.user.isResident !== undefined) setIsResident(data.user.isResident);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculation = useMemo(() => {
    if (!startDate || !endDate) return null;

    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
    setSubmitting(true);

    try {
      // If logged in — submit directly
      if (isLoggedIn) {
        await submitBooking();
        return;
      }

      // Not logged in — send OTP for verification
      if (emailExists) {
        // Already known user — prompt to login first
        setShowLoginBanner(true);
        return;
      }

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "REGISTER" }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setEmailExists(true);
          setShowLoginBanner(true);
          return;
        }
        setError(data.error || t("error"));
        return;
      }

      setNeedsOtp(true);
      startCooldown();
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyAndSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await submitBooking(otpCode);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBooking(otp?: string) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carId,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        customerIin: iin || undefined,
        isResident,
        otpCode: otp,
        startDate: startDate ? formatDateForAPI(startDate, startTime) : "",
        endDate: endDate ? formatDateForAPI(endDate, endTime) : "",
        comment: comment || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === "INVALID_OTP") {
        setError(t("invalidOtp"));
      } else if (data.error === "DATE_CONFLICT") {
        setError(t("dateConflict"));
      } else {
        setError(data.error || t("error"));
      }
      return;
    }

    setSuccess(true);
    setIsNewUser(!!data.newUser);
    setNeedsOtp(false);
    setStartDate("");
    setEndDate("");
    setComment("");

    if (!isLoggedIn) {
      setIsLoggedIn(true);
    }
  }

  async function fillUserData() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setName(`${u.firstName} ${u.lastName}`.trim());
        if (u.phone) setPhone(u.phone);
        if (u.email) setEmail(u.email);
        if (u.iin) setIin(u.iin);
        if (u.isResident !== undefined) setIsResident(u.isResident);
        setIsLoggedIn(true);
        setShowLoginBanner(false);
        setEmailExists(false);
        setLoginMode(null);
        setError("");
        // Notify Header to update auth state
        window.dispatchEvent(new Event("auth-changed"));
      }
    } catch {
      // ignore
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      if (res.ok) {
        await fillUserData();
      } else {
        setError(t("loginError"));
      }
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpLogin(code: string) {
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        await fillUserData();
      } else {
        setError(t("invalidOtp"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendOtp() {
    setError("");
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "REGISTER" }),
      });
      startCooldown();
    } catch {
      setError(t("error"));
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email — first field */}
        <div>
          <label
            htmlFor="booking-email"
            className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
          >
            Email {!isLoggedIn && "*"}
          </label>
          <input
            id="booking-email"
            type="email"
            required={!isLoggedIn}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailExists(false); setShowLoginBanner(false); setLoginMode(null); }}
            onBlur={checkEmail}
            disabled={isLoggedIn}
            className={`w-full px-4 py-3.5 border-2 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold ${
              isLoggedIn ? "bg-gray-50 text-gray-500 border-gray-100" : emailExists ? "border-amber-300 bg-amber-50" : "bg-white text-gray-900 border-gray-100"
            }`}
            placeholder="email@example.kz"
          />
          {!isLoggedIn && !showLoginBanner && (
            <p className="mt-1 text-xs text-gray-400 ml-1">{t("emailNote")}</p>
          )}

          {/* Login banner — appears when email exists */}
          {showLoginBanner && !isLoggedIn && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-sm font-medium text-amber-800 mb-3">{t("accountFoundInline")}</p>

              {!loginMode && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginMode("password")}
                    className="flex-1 py-2 px-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    {t("loginWithPassword")}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoginMode("otp");
                      await fetch("/api/auth/send-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, type: "LOGIN" }),
                      });
                      startCooldown();
                    }}
                    className="flex-1 py-2 px-3 bg-cyan-500 rounded-xl text-xs font-bold text-white hover:bg-cyan-600 transition-colors"
                  >
                    {t("loginWithOtp")}
                  </button>
                </div>
              )}

              {loginMode === "password" && (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t("password")}
                    className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-semibold focus:border-cyan-500 focus:outline-none"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLogin(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleLogin as unknown as () => void} disabled={submitting} className="flex-1 py-2 bg-cyan-500 text-white text-xs font-bold rounded-xl hover:bg-cyan-600 disabled:opacity-50">
                      {submitting ? "..." : t("loginBtn")}
                    </button>
                    <button type="button" onClick={() => setLoginMode(null)} className="py-2 px-3 text-xs text-gray-500 hover:text-gray-700">
                      {t("cancelLogin")}
                    </button>
                  </div>
                </div>
              )}

              {loginMode === "otp" && (
                <div className="space-y-2">
                  <p className="text-xs text-amber-600">{t("otpSentTo")} <strong>{email}</strong></p>
                  <input
                    type="text"
                    value={loginOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setLoginOtp(val);
                      if (val.length === 6) handleOtpLogin(val);
                    }}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-center text-lg tracking-[0.3em] font-bold focus:border-cyan-500 focus:outline-none"
                    autoFocus
                    disabled={submitting}
                  />
                  {submitting && (
                    <p className="text-xs text-cyan-600 text-center">{t("verifying")}</p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setLoginMode(null)} className="flex-1 py-2 px-3 text-xs text-gray-500 hover:text-gray-700">
                      {t("cancelLogin")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
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

        {/* IIN section */}
        {!isLoggedIn && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="booking-resident"
                type="checkbox"
                checked={isResident}
                onChange={(e) => { setIsResident(e.target.checked); if (!e.target.checked) setIin(""); }}
                className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="booking-resident" className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {t("isResident")}
              </label>
            </div>
            <div>
              <label
                htmlFor="booking-iin"
                className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
              >
                {t("iin")} {isResident && "*"}
              </label>
              <input
                id="booking-iin"
                type="text"
                value={iin}
                onChange={(e) => setIin(e.target.value.replace(/\D/g, "").slice(0, 12))}
                required={isResident}
                maxLength={12}
                className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900"
                placeholder="000000000000"
              />
            </div>
          </div>
        )}

        {/* Dates & Times */}
        <div className="space-y-5">
           <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">
               {t("startDate")} *
             </label>
             <div className="flex gap-3">
               <DatePicker
                 selected={startDate}
                 onChange={(date) => {
                   setStartDate(date);
                   if (date && endDate && date > endDate) setEndDate(null);
                 }}
                 dateFormat="dd.MM.yyyy"
                 minDate={today}
                 locale={dpLocale}
                 placeholderText={t("selectDate")}
                 className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900"
                 wrapperClassName="flex-1"
                 popperPlacement="bottom-start"
                 portalId="datepicker-portal"
               />
               <select
                 value={startTime}
                 onChange={(e) => setStartTime(e.target.value)}
                 className="w-28 shrink-0 px-3 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900 text-center"
               >
                 {TIME_OPTIONS.map((t) => (
                   <option key={t} value={t}>{t}</option>
                 ))}
               </select>
             </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">
               {t("endDate")} *
             </label>
             <div className="flex gap-3">
               <DatePicker
                 selected={endDate}
                 onChange={(date) => setEndDate(date)}
                 dateFormat="dd.MM.yyyy"
                 minDate={startDate || today}
                 locale={dpLocale}
                 placeholderText={t("selectDate")}
                 className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900"
                 wrapperClassName="flex-1"
                 popperPlacement="bottom-start"
                 portalId="datepicker-portal"
               />
               <select
                 value={endTime}
                 onChange={(e) => setEndTime(e.target.value)}
                 className="w-28 shrink-0 px-3 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors font-semibold text-gray-900 text-center"
               >
                 {TIME_OPTIONS.map((t) => (
                   <option key={t} value={t}>{t}</option>
                 ))}
               </select>
             </div>
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
        {!needsOtp && (
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
        )}

        {/* Inline result messages */}
        <div ref={resultRef}>
          {success && (
            <div className="p-5 bg-green-50 border-2 border-green-300 text-green-800 rounded-2xl text-sm space-y-2 animate-in fade-in">
              <div className="flex items-center gap-3 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                {t("success")}
              </div>
              {isNewUser && (
                <p className="text-xs text-green-600 ml-9">
                  {t("setPasswordHint")}
                </p>
              )}
            </div>
          )}

          {error && !success && (
            <div className="p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-2xl text-sm flex items-center gap-3 font-bold animate-in fade-in">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </form>

      {/* OTP verification step */}
      {needsOtp && (
        <form onSubmit={handleVerifyAndSubmit} className="space-y-4 mt-4">
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-sm text-cyan-800">
            <p className="font-medium">{t("otpSentTo")} <strong>{email}</strong></p>
            <p className="text-xs mt-1 text-cyan-600">{t("otpHint")}</p>
          </div>

          <div>
            <label
              htmlFor="booking-otp"
              className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2"
            >
              {t("enterOtp")}
            </label>
            <input
              id="booking-otp"
              type="text"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpCode(val);
                if (val.length === 6) {
                  // Auto-submit when 6 digits entered
                  setTimeout(() => {
                    const form = e.target.closest("form");
                    if (form) form.requestSubmit();
                  }, 100);
                }
              }}
              required
              maxLength={6}
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors text-center text-2xl tracking-[0.5em] font-bold text-gray-900"
              placeholder="000000"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || otpCode.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/30"
          >
            {submitting ? "..." : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {t("confirmAndSubmit")}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={cooldown > 0}
            className="w-full text-sm text-cyan-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {cooldown > 0 ? `${t("resendOtp")} (${cooldown}s)` : t("resendOtp")}
          </button>
        </form>
      )}

    </div>
  );
}
