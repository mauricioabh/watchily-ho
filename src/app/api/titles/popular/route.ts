import { NextRequest } from "next/server";
import { getPopularTitlesPaged } from "@/lib/streaming/unified";
import {
  PROVIDER_TO_SOURCE_ID,
  filterTitlesByUserProviders,
} from "@/lib/streaming/providers";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import type { UnifiedTitle } from "@/types/streaming";

const DEFAULT_PAGE_SIZE = 16;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "movie" | "series" | omit both
  const country = searchParams.get("country") ?? "MX";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    40,
    Math.max(
      1,
      Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) ||
        DEFAULT_PAGE_SIZE,
    ),
  );

  try {
    const { client: supabase, user } = await getSupabaseAndUser();

    const { data: providerRows } = user
      ? await supabase
          .from("user_providers")
          .select("provider_id")
          .eq("user_id", user.id)
      : { data: [] };

    const userProviderIds = (providerRows ?? []).map(
      (r: { provider_id: string }) => r.provider_id,
    );

    // Optional subset filter: ?providers=netflix,disney_plus
    // - omit → all subscribed providers
    // - empty → no titles
    // - list → intersection with subscribed
    const providersParam = searchParams.get("providers");
    let filterProviderIds = userProviderIds;
    if (providersParam !== null) {
      const requested = providersParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const allowed = new Set(userProviderIds);
      filterProviderIds = requested.filter((id) => allowed.has(id));
    }

    if (filterProviderIds.length === 0) {
      return Response.json({ titles: [], page, hasMore: false });
    }

    const sourceIds = filterProviderIds
      .map((id: string) => PROVIDER_TO_SOURCE_ID[id])
      .filter(Boolean) as number[];

    const baseOpts = {
      country,
      enrich: true,
      sourceIds,
      page,
      pageSize,
    };

    let titles: UnifiedTitle[] = [];
    let hasMore = false;

    if (type === "movie" || type === "series") {
      const result = await getPopularTitlesPaged({
        ...baseOpts,
        type,
      });
      titles = filterTitlesByUserProviders(result.titles, filterProviderIds);
      hasMore = result.hasMore;
    } else {
      const [movies, series] = await Promise.all([
        getPopularTitlesPaged({ ...baseOpts, type: "movie" }),
        getPopularTitlesPaged({ ...baseOpts, type: "series" }),
      ]);
      titles = filterTitlesByUserProviders(
        [...movies.titles, ...series.titles],
        filterProviderIds,
      );
      hasMore = movies.hasMore || series.hasMore;
    }

    return Response.json({ titles, page, hasMore });
  } catch (e) {
    console.error("Popular titles error:", e);
    return Response.json({ titles: [], page, hasMore: false }, { status: 500 });
  }
}
