import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "kz" ? "Кіру — Qazqar" : "Вход — Qazqar",
  };
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
