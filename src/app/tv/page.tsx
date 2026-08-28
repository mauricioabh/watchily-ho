import { getPopularTitles } from "@/lib/streaming/unified";
import {
  PROVIDER_TO_SOURCE_ID,
  filterTitlesByUserProviders,
} from "@/lib/streaming/providers";
import { createClient } from "@/lib/supabase/server";
import { TitleTile } from "@/components/title-tile";
import { TVPageClient, type TVPageLabels } from "@/components/tv-page-client";
import type { AppLocale } from "@/i18n/locale";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import { Suspense } from "react";

async function TVPopular() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: providerRows } = user
    ? await supabase
        .from("user_providers")
        .select("provider_id")
        .eq("user_id", user.id)
    : { data: [] };

  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
  const sourceIds = userProviderIds
    .map((id) => PROVIDER_TO_SOURCE_ID[id])
    .filter(Boolean) as number[];

  const [movies, series] = await Promise.all([
    getPopularTitles({ type: "movie", enrich: true, sourceIds }),
    getPopularTitles({ type: "series", enrich: true, sourceIds }),
  ]);

  // Trim each title's sources to only the user's subscribed providers
  const combined = filterTitlesByUserProviders(
    [...movies, ...series],
    userProviderIds,
  ).slice(0, 20);

  return (
    <div className="grid grid-cols-4 gap-6">
      {combined.map((title) => (
        <div
          key={title.id}
          className="focusable-tv focus:outline-2 focus:outline-primary"
        >
          <TitleTile title={title} />
        </div>
      ))}
    </div>
  );
}

export default function TVPage({ locale = "en" }: { locale?: AppLocale }) {
  const labels: TVPageLabels = locale === "es" ? esMessages.tv : enMessages.tv;

  return (
    <main>
      <TVPageClient labels={labels} locale={locale} />
      <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
        <TVPopular />
      </Suspense>
    </main>
  );
}
