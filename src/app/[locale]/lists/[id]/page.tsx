import ListDetailPage from "@/app/lists/[id]/page";
import { isAppLocale, type AppLocale } from "@/i18n/locale";
import { notFound } from "next/navigation";

export default async function LocalizedListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  return (
    <ListDetailPage
      locale={locale as AppLocale}
      params={Promise.resolve({ id })}
      searchParams={searchParams}
    />
  );
}
