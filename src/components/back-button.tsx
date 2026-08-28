"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localizedPath } from "@/i18n/routing";

export function BackButton({ fallback = "/library" }: { fallback?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("common");

  const handleBack = () => {
    // Try browser history first; if we're at the root of the history stack, go to fallback
    try {
      router.back();
    } catch {
      router.push(localizedPath(fallback, locale));
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      {t("back")}
    </button>
  );
}
