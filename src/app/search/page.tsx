import { Suspense } from "react";
import { getPopularTitles } from "@/lib/streaming/unified";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { createClient } from "@/lib/supabase/server";
import { SearchContent } from "@/components/search-content";
import type { UnifiedTitle } from "@/types/streaming";

async function getPopularForUser(): Promise<UnifiedTitle[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: providerRows } = user
      ? await supabase.from("user_providers").select("provider_id").eq("user_id", user.id)
      : { data: [] };

    const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
    const sourceIds = userProviderIds
      .map((id) => PROVIDER_TO_SOURCE_ID[id])
      .filter(Boolean) as number[];

    const [movies, series] = await Promise.all([
      getPopularTitles({ type: "movie", enrich: true, sourceIds }),
      getPopularTitles({ type: "series", enrich: true, sourceIds }),
    ]);

    const all = [...movies, ...series];
    // Trim sources to only the user's subscribed providers
    return filterTitlesByUserProviders(all, userProviderIds).slice(0, 24) as UnifiedTitle[];
  } catch {
    return [];
  }
}

export default async function SearchPage() {
  const popular = await getPopularForUser();

  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-muted-foreground">Cargando...</p>
        </main>
      }
    >
      <SearchContent popular={popular} />
    </Suspense>
  );
}
