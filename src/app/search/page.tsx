import { Suspense } from "react";
import { getPopularTitlesPaged } from "@/lib/streaming/unified";
import {
  PROVIDER_TO_SOURCE_ID,
  filterTitlesByUserProviders,
} from "@/lib/streaming/providers";
import { createClient } from "@/lib/supabase/server";
import { SearchContent } from "@/components/search-content";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";

const PAGE_SIZE = 16;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  return buildPageMetadata({
    title: t("search"),
    pathname: "/search",
    locale,
  });
}

async function SearchPageData() {
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
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("country_code")
        .eq("id", user.id)
        .single()
    : { data: null };
  const country = profile?.country_code ?? "MX";
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

  const initialTitles = filterTitlesByUserProviders(
    [...movies.titles, ...series.titles],
    userProviderIds,
  );
  const initialHasMore = movies.hasMore || series.hasMore;

  return (
    <SearchContent
      initialTitles={initialTitles}
      initialPage={1}
      initialHasMore={initialHasMore}
      userProviderIds={userProviderIds}
      userScope={user?.id ?? null}
      country={country}
    />
  );
}

export default async function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      }
    >
      <SearchPageData />
    </Suspense>
  );
}
