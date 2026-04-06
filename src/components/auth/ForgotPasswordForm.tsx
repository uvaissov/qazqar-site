"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "USER_NOT_FOUND" ? t("userNotFound") : data.error || t("error"));
        return false;
      }
      startCooldown();
      return true;
    } catch {
      setError(t("error"));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendOtp();
    if (ok) setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, type: "RESET_PASSWORD" }),
      });
      if (!res.ok) {
        setError(t("invalidOtp"));
        return;
      }
      setStep("password");
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error === "INVALID_OTP" ? t("otpExpired") : t("error"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("passwordChanged")}</h2>
          <p className="text-gray-500 mb-6">{t("passwordChangedDesc")}</p>
          <Link href="/login" className="inline-block rounded-lg bg-cyan-500 px-6 py-2.5 font-medium text-white hover:bg-cyan-600">
            {t("loginLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          {t("forgotPassword")}
        </h1>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                {t("email")}
              </label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>
            <p className="text-sm text-gray-500">{t("resetOtpWillBeSent")}</p>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50">
              {loading ? "..." : t("sendOtp")}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {t("otpSentTo")} <strong>{email}</strong>
            </p>
            <div>
              <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
                {t("enterOtp")}
              </label>
              <input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
                placeholder="000000"
                autoFocus
              />
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50">
              {loading ? "..." : t("verify")}
            </button>
            <button type="button" onClick={() => sendOtp()} disabled={cooldown > 0} className="w-full text-sm text-cyan-600 hover:underline disabled:text-gray-400 disabled:no-underline">
              {cooldown > 0 ? `${t("resendOtp")} (${cooldown}s)` : t("resendOtp")}
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
                {t("newPassword")}
              </label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="mb-1 block text-sm font-medium text-gray-700">
                {t("confirmPassword")}
              </label>
              <input id="confirmNewPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputClass} />
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50">
              {loading ? "..." : t("resetPassword")}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-cyan-500 hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
