import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { NextIntlClientProvider } from "next-intl";
import { LocaleDocumentLang } from "@/components/locale-document-lang";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleDocumentLang />
      {children}
    </NextIntlClientProvider>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: value } = await params;
  if (!hasLocale(routing.locales, value)) return {};
  const locale = value as AppLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return buildPageMetadata({
    title: t("defaultTitle"),
    description: t("defaultDescription"),
    pathname: locale === "es" ? "/es" : "/",
    locale,
  });
}
