"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type LoginMode = "password" | "otp";
type OtpStep = "email" | "code";

export default function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function switchMode(newMode: LoginMode) {
    setMode(newMode);
    setError("");
    setOtpStep("email");
    setOtpCode("");
  }

  const loginSuccess = useCallback(
    (data: { user: { role: string } }) => {
      window.dispatchEvent(new Event("auth-changed"));
      router.push(data.user.role === "ADMIN" ? "/admin" : "/cabinet");
    },
    [router]
  );

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(t("error"));
        return;
      }

      loginSuccess(await res.json());
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "LOGIN" }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "USER_NOT_FOUND") {
          setError(t("userNotFound"));
        } else {
          setError(t("error"));
        }
        return;
      }

      setOtpStep("code");
      setCountdown(60);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "INVALID_OTP") {
          setError(t("invalidOtp"));
        } else {
          setError(t("error"));
        }
        return;
      }

      loginSuccess(await res.json());
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          {t("login")}
        </h1>

        {/* Mode tabs */}
        <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "password"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("password")}
          </button>
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "otp"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("enterOtp")}
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="email@example.kz"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-cyan-500 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "..." : t("submit")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div>
              <label
                htmlFor="otp-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("email")}
              </label>
              <input
                id="otp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={otpStep === "code"}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="email@example.kz"
              />
            </div>

            {otpStep === "code" && (
              <>
                <p className="text-sm text-gray-500">
                  {t("otpSentTo")} <span className="font-medium text-gray-700">{email}</span>
                </p>
                <div>
                  <label
                    htmlFor="otp-code"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {t("enterOtp")}
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    maxLength={6}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.3em] text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    autoFocus
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            {otpStep === "email" ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "..." : t("sendOtp")}
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "..." : t("submit")}
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("email");
                      setOtpCode("");
                      setError("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {t("backToLogin")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-sm text-cyan-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {countdown > 0
                      ? `${t("resendOtp")} (${countdown})`
                      : t("resendOtp")}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-cyan-500 hover:underline">
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
