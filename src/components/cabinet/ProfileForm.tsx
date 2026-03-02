"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type UserData = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

export default function ProfileForm({ user }: { user: UserData }) {
  const t = useTranslations("cabinet");
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePassword(field: string, value: string) {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const body: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };

      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          setError(t("passwordMismatch"));
          setLoading(false);
          return;
        }
        if (passwords.newPassword.length < 6) {
          setError(t("passwordTooShort"));
          setLoading(false);
          return;
        }
        body.currentPassword = passwords.currentPassword;
        body.newPassword = passwords.newPassword;
      }

      const res = await fetch("/api/cabinet/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error === "WRONG_PASSWORD" ? t("wrongPassword") : t("updateError"));
        return;
      }

      setMessage(t("updateSuccess"));
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError(t("updateError"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {/* Personal info */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("firstName")}
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("lastName")}
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("phone")}
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={inputClass}
            placeholder="+7 7XX XXX XX XX"
          />
        </div>
      </div>

      {/* Password change */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">{t("changePassword")}</h3>
        <div className="space-y-3">
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => updatePassword("currentPassword", e.target.value)}
            className={inputClass}
            placeholder={t("currentPassword")}
          />
          <input
            type="password"
            value={passwords.newPassword}
            onChange={(e) => updatePassword("newPassword", e.target.value)}
            className={inputClass}
            placeholder={t("newPassword")}
          />
          <input
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => updatePassword("confirmPassword", e.target.value)}
            className={inputClass}
            placeholder={t("confirmNewPassword")}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-cyan-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
      >
        {loading ? "..." : t("save")}
      </button>
    </form>
  );
}
