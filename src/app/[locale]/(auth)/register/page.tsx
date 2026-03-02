import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "kz" ? "Тіркелу — Qazqar" : "Регистрация — Qazqar",
  };
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
