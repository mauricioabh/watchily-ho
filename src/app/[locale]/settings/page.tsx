import SettingsPage from "@/app/settings/page";
import { isAppLocale, type AppLocale } from "@/i18n/locale";
import { notFound } from "next/navigation";

export default async function LocalizedSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  return <SettingsPage locale={locale as AppLocale} />;
}
