import { Suspense } from "react";
import { getPopularTitles } from "@/lib/streaming/unified";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { TitleTile } from "@/components/title-tile";
import { createClient } from "@/lib/supabase/server";

async function PopularContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: providerRows } = user
    ? await supabase.from("user_providers").select("provider_id").eq("user_id", user.id)
    : { data: [] };

  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
  // Map provider IDs → Watchmode source IDs so the API pre-filters for us
  const sourceIds = userProviderIds
    .map((id) => PROVIDER_TO_SOURCE_ID[id])
    .filter(Boolean) as number[];

  const [movies, series] = await Promise.all([
    getPopularTitles({ type: "movie", enrich: true, sourceIds }),
    getPopularTitles({ type: "series", enrich: true, sourceIds }),
  ]);

  // Trim each title's sources to only the user's subscribed providers
  const trimmed = filterTitlesByUserProviders([...movies, ...series], userProviderIds);
  const combined = trimmed.slice(0, 32);

  return combined.length === 0 ? (
    <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
      <p className="text-muted-foreground">
        No hay contenido popular en tus plataformas por ahora.
      </p>
    </div>
  ) : (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {combined.map((title) => (
        <TitleTile key={title.id} title={title} />
      ))}
    </div>
  );
}

export default function PopularPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">
        Películas y series populares
      </h1>
      <Suspense
        fallback={
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        }
      >
        <PopularContent />
      </Suspense>
    </main>
  );
}
