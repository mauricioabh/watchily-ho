import TitlePage, {
  generateMetadata as generateTitleMetadata,
} from "@/app/title/[id]/page";
import { isAppLocale, type AppLocale } from "@/i18n/locale";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) return {};
  return generateTitleMetadata({
    locale: locale as AppLocale,
    params: Promise.resolve({ id }),
  });
}

export default async function LocalizedTitlePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  return (
    <TitlePage
      locale={locale as AppLocale}
      params={Promise.resolve({ id })}
      searchParams={searchParams}
    />
  );
}
