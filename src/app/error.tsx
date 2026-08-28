"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
      <h2 className="text-2xl font-bold">{t("somethingWentWrong")}</h2>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        {t("retry")}
      </button>
    </main>
  );
}
