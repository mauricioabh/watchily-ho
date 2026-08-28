import type { AppLocale } from "@/i18n/locale";
import TVPage from "@/app/tv/page";

export default async function LocaleTVPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale: AppLocale = locale === "es" ? "es" : "en";

  return <TVPage locale={appLocale} />;
}
