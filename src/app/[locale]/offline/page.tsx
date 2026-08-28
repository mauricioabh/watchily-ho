import OfflinePage from "@/app/offline/page";
import { isAppLocale, type AppLocale } from "@/i18n/locale";
import { notFound } from "next/navigation";

export default async function LocalizedOfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <OfflinePage locale={locale as AppLocale} />;
}
