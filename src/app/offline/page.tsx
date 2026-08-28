import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OfflinePage({
  locale,
}: {
  locale?: AppLocale;
} = {}) {
  const t = await getTranslations({
    locale: locale ?? (await getLocale()),
    namespace: "errors",
  });
  return (
    <main className="container mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <WifiOff className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("offlineTitle")}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {t("offlineDescription")}
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/popular">{t("retry")}</Link>
        </Button>
      </div>
    </main>
  );
}
