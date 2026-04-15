"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Step = "email" | "otp" | "details";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    iin: "",
    isResident: true,
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
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
        body: JSON.stringify({ email, type: "REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "EMAIL_EXISTS" ? t("emailExists") : data.error || t("error"));
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
        body: JSON.stringify({ email, code: otpCode, type: "REGISTER" }),
      });
      if (!res.ok) {
        setError(t("invalidOtp"));
        return;
      }
      setStep("details");
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.isResident && !form.iin) {
      setError(t("iinRequired"));
      return;
    }
    if (form.isResident && form.iin.length !== 12) {
      setError(t("iinInvalid"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email,
          phone: form.phone,
          iin: form.iin || null,
          isResident: form.isResident,
          password: form.password,
          otpCode,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        const errorMap: Record<string, string> = {
          INVALID_OTP: t("otpExpired"),
          EMAIL_EXISTS: t("emailExists"),
          IIN_REQUIRED: t("iinRequired"),
          IIN_FORMAT: t("iinInvalid"),
          IIN_INVALID: t("iinInvalid"),
          IIN_CHECKSUM: t("iinChecksum"),
          IIN_EXISTS: t("iinExists"),
          IIN_NOT_FOUND_CRM: t("iinNotFoundCrm"),
        };
        setError(errorMap[data.error] || t("registerError"));
        if (data.error === "INVALID_OTP") setStep("email");
        return;
      }
      router.push("/cabinet");
    } catch {
      setError(t("registerError"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {t("register")}
        </h1>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["email", "otp", "details"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s
                    ? "bg-cyan-500 text-white"
                    : i < ["email", "otp", "details"].indexOf(step)
                    ? "bg-cyan-100 text-cyan-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="email@example.kz"
              />
            </div>
            <p className="text-sm text-gray-500">{t("otpWillBeSent")}</p>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
            >
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
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? "..." : t("verify")}
            </button>
            <button
              type="button"
              onClick={() => sendOtp()}
              disabled={cooldown > 0}
              className="w-full text-sm text-cyan-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {cooldown > 0 ? `${t("resendOtp")} (${cooldown}s)` : t("resendOtp")}
            </button>
          </form>
        )}

        {/* Step 3: Details */}
        {step === "details" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                  {t("firstName")}
                </label>
                <input id="firstName" type="text" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                  {t("lastName")}
                </label>
                <input id="lastName" type="text" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                {t("phone")}
              </label>
              <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} placeholder="+7 7XX XXX XX XX" />
            </div>

            {/* Resident toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                id="isResident"
                type="checkbox"
                checked={form.isResident}
                onChange={(e) => setForm((p) => ({ ...p, isResident: e.target.checked, iin: e.target.checked ? p.iin : "" }))}
                className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isResident" className="text-sm font-medium text-gray-700">
                {t("isResident")}
              </label>
            </div>

            {/* IIN */}
            <div>
              <label htmlFor="iin" className="mb-1 block text-sm font-medium text-gray-700">
                {t("iin")} {form.isResident && <span className="text-red-500">*</span>}
              </label>
              <input
                id="iin"
                type="text"
                value={form.iin}
                onChange={(e) => setForm((p) => ({ ...p, iin: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                required={form.isResident}
                maxLength={12}
                className={inputClass}
                placeholder="000000000000"
              />
              {!form.isResident && (
                <p className="mt-1 text-xs text-gray-400">{t("iinOptional")}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                {t("password")}
              </label>
              <input id="password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} className={inputClass} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                {t("confirmPassword")}
              </label>
              <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} required minLength={6} className={inputClass} />
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50">
              {loading ? "..." : t("registerSubmit")}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-cyan-500 hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
