import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация — Qazqar",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
