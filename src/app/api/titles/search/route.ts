import { NextRequest } from "next/server";
import { searchTitles, getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import type { UnifiedTitle } from "@/types/streaming";

const ENRICH_COUNT = 8;

export async function GET(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  if (!q || q.trim().length === 0) {
    return Response.json({ titles: [], totalCount: 0 });
  }

  const [{ data: profile }, { data: providerRows }] = await Promise.all([
    supabase.from("profiles").select("country_code").eq("id", user.id).single(),
    supabase.from("user_providers").select("provider_id").eq("user_id", user.id),
  ]);

  const country = searchParams.get("country") ?? profile?.country_code ?? "MX";
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);

  try {
    const types = type ? ([type] as ("movie" | "series")[]) : undefined;
    const result = await searchTitles(q.trim(), { types, country });

    if (result.titles.length === 0) return Response.json(result);

    // Enrich top N with details + sources (single API call each via append_to_response)
    const toEnrich = result.titles.slice(0, ENRICH_COUNT);
    const rest = result.titles.slice(ENRICH_COUNT);

    const enriched = await Promise.allSettled(
      toEnrich.map((t) => getTitleDetails(t.id, { country, region: country }))
    );

    const enrichedTitles: UnifiedTitle[] = toEnrich.map((original, i) => {
      const settled = enriched[i];
      if (settled.status === "fulfilled" && settled.value) {
        const detail = settled.value;
        return { ...detail, poster: detail.poster ?? original.poster };
      }
      return original;
    });

    // Filter: only titles on user's subscriptions, trim sources to matched ones
    // Also require a poster so every tile has something to display
    const filtered = filterTitlesByUserProviders(
      [...enrichedTitles, ...rest],
      userProviderIds
    ).filter((t) => t.poster?.startsWith("http"));

    return Response.json({ titles: filtered, totalCount: filtered.length });
  } catch (e) {
    console.error("Search error:", e);
    return Response.json({ titles: [], totalCount: 0 }, { status: 500 });
  }
}
