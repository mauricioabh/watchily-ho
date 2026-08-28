import Home from "@/app/page";
import { isAppLocale, type AppLocale } from "@/i18n/locale";
import { notFound } from "next/navigation";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <Home locale={locale as AppLocale} />;
}
