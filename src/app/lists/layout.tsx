import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("lists");
  return buildPageMetadata({
    title: t("title"),
    pathname: "/lists",
    noIndex: true,
    locale,
  });
}

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
