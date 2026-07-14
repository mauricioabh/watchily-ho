import { Suspense } from "react";
import { getPopularTitlesPaged } from "@/lib/streaming/unified";
import {
  PROVIDER_TO_SOURCE_ID,
  filterTitlesByUserProviders,
} from "@/lib/streaming/providers";
import { createClient } from "@/lib/supabase/server";
import { PopularInfiniteGrid } from "@/components/popular-infinite-grid";

const PAGE_SIZE = 16;

async function PopularContent() {
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
  // Map provider IDs → Watchmode source IDs so the API pre-filters for us
  const sourceIds = userProviderIds
    .map((id) => PROVIDER_TO_SOURCE_ID[id])
    .filter(Boolean) as number[];

  const [movies, series] = await Promise.all([
    getPopularTitlesPaged({
      type: "movie",
      enrich: true,
      sourceIds,
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    getPopularTitlesPaged({
      type: "series",
      enrich: true,
      sourceIds,
      page: 1,
      pageSize: PAGE_SIZE,
    }),
  ]);

  // Trim each title's sources to only the user's subscribed providers
  const titles = filterTitlesByUserProviders(
    [...movies.titles, ...series.titles],
    userProviderIds,
  );
  const hasMore = movies.hasMore || series.hasMore;

  return (
    <PopularInfiniteGrid
      initialTitles={titles}
      initialPage={1}
      initialHasMore={hasMore}
    />
  );
}

export default function PopularPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-3xl">
        Películas y series populares
      </h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        }
      >
        <PopularContent />
      </Suspense>
    </main>
  );
}
