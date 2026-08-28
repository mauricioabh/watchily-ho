import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
      <p className="text-muted-foreground" role="status">
        {t("loading")}
      </p>
    </main>
  );
}
