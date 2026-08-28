import { redirect } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
import { createClient } from "@/lib/supabase/server";
import { AuthInlineCard } from "@/components/auth-inline-card";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { AppLocale } from "@/i18n/routing";
import { localizedPath } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  return buildPageMetadata({
    title: t("home"),
    description: t("defaultDescription"),
    pathname: "/",
    locale,
  });
}

export default async function Home({ locale }: { locale?: AppLocale } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(localizedPath("/library", locale ?? (await getLocale())));

  const t = await getTranslations({
    locale: locale ?? (await getLocale()),
    namespace: "home",
  });

  return (
    <main className="container mx-auto max-w-6xl px-4 sm:px-6">
      <AnimatedSection>
        <section className="relative py-14 sm:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {t("description")}
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <AuthInlineCard />
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
