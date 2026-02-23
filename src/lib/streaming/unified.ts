import type { UnifiedTitle, UnifiedSearchResult, StreamingSource } from "@/types/streaming";
import * as watchmode from "./watchmode";
import * as streamingAvailability from "./streaming-availability";

function mapWatchmodeDetailsToUnified(
  d: watchmode.WatchmodeTitleDetails,
  sources?: watchmode.WatchmodeSource[]
): UnifiedTitle {
  const src: StreamingSource[] = (sources ?? []).map((s) => ({
    providerId: String(s.source_id),
    providerName: s.name,
    type: (s.type as "sub" | "rent" | "buy" | "free") ?? "sub",
    price: s.price,
    currency: s.currency,
    url: s.web_url,
    quality: s.format as StreamingSource["quality"],
  }));
  return {
    id: String(d.id),
    name: d.title,                          // Watchmode uses "title" not "name"
    originalName: d.original_title,
    type: d.type === "tv_series" ? "series" : "movie",
    year: d.year,
    poster: d.posterLarge ?? d.posterMedium ?? d.poster,
    backdrop: d.backdrop,
    overview: d.plot_overview,              // Watchmode uses "plot_overview"
    imdbRating: d.imdb_rating,
    rottenTomatoesRating: d.rotten_tomatoes,
    userRating: d.user_rating,
    criticScore: d.critic_score,
    runtime: d.runtime_minutes,             // Watchmode uses "runtime_minutes"
    genres: d.genre_names,
    sources: src.length ? src : undefined,
    trailer: d.trailer,
  };
}

function mapWatchmodeResultToUnified(r: watchmode.WatchmodeTitleResult): UnifiedTitle {
  return {
    id: String(r.id),
    name: r.name,
    type: r.type === "tv_series" ? "series" : "movie",
    year: r.year,
    poster: r.image,
  };
}

function mapWatchmodeAutocompleteToUnified(r: watchmode.WatchmodeAutocompleteResult): UnifiedTitle {
  return {
    id: String(r.id),
    name: r.name,
    type: r.type === "tv_series" ? "series" : "movie",
    year: r.year,
    poster: r.image_url,  // thumbnail from CDN — already sorted by relevance
  };
}

export async function searchTitles(
  query: string,
  options?: { types?: ("movie" | "series")[]; country?: string }
): Promise<UnifiedSearchResult> {
  const country = (options?.country ?? "us").toLowerCase();

  // Primary: Watchmode autocomplete — relevance-sorted + thumbnails
  try {
    const res = await watchmode.watchmodeAutocompleteSearch(query);
    let results = res.results ?? [];

    // Client-side type filter if specified
    if (options?.types?.length) {
      const wmTypes = options.types.map((t) => (t === "series" ? "tv_series" : "movie"));
      results = results.filter((r) => wmTypes.includes(r.type));
    }

    const titles = results.map(mapWatchmodeAutocompleteToUnified);
    if (titles.length > 0) {
      return { titles, totalCount: titles.length };
    }
  } catch {
    // fall through
  }

  // Fallback: legacy Watchmode search
  try {
    const types = options?.types?.map((t) => (t === "series" ? "tv_series" : "movie"));
    const res = await watchmode.watchmodeSearch(query, types);
    const titles = (res.title_results ?? []).map(mapWatchmodeResultToUnified);
    if (titles.length > 0) {
      return { titles, totalCount: titles.length };
    }
  } catch {
    // fall through
  }

  // Last resort: Streaming Availability API
  try {
    const titles = await streamingAvailability.streamingAvailabilitySearch(query, country);
    return { titles, totalCount: titles.length };
  } catch {
    return { titles: [], totalCount: 0 };
  }
}

export async function getTitleDetails(
  id: string,
  options?: { region?: string; country?: string }
): Promise<UnifiedTitle | null> {
  const region = options?.region ?? options?.country ?? "US";
  try {
    // Single call: details + sources via append_to_response (half the API quota)
    const details = await watchmode.watchmodeTitleDetails(id, region);
    if (details) {
      // sources are embedded in details when append_to_response=sources is used
      return mapWatchmodeDetailsToUnified(details, details.sources);
    }
  } catch {
    // fallback
  }
  const sa = await streamingAvailability.streamingAvailabilityGetTitle(
    id,
    (options?.country ?? options?.region ?? "us").toLowerCase()
  );
  return sa;
}

export async function getPopularTitles(options?: {
  type?: "movie" | "series";
  country?: string;
  enrich?: boolean;
  sourceIds?: number[]; // Watchmode source IDs to pre-filter by provider
}): Promise<UnifiedTitle[]> {
  const type = options?.type ?? "movie";
  const country = options?.country ?? "US";

  try {
    const list = await watchmode.watchmodeListTitles(
      type === "movie" ? "movie" : "tv_series",
      { pageSize: 20, sourceIds: options?.sourceIds }
    );

    const basic: UnifiedTitle[] = list.map((t) => ({
      id: String(t.id),
      name: t.name,
      type: type === "movie" ? "movie" : "series",
      year: t.year,
      poster: t.image,
    }));

    if (!options?.enrich || basic.length === 0) return basic;

    // Enrich only top 12 for ratings + sources (API already filtered by provider)
    const ENRICH = 12;
    const toEnrich = basic.slice(0, ENRICH);
    const rest = basic.slice(ENRICH);

    const enriched = await Promise.allSettled(
      toEnrich.map((t) => getTitleDetails(t.id, { country, region: country }))
    );

    const enrichedTitles: UnifiedTitle[] = toEnrich.map((original, i) => {
      const r = enriched[i];
      if (r.status === "fulfilled" && r.value) {
        return { ...r.value, poster: r.value.poster ?? original.poster };
      }
      return original;
    });

    // Only return titles that have a poster to display
    return [...enrichedTitles, ...rest].filter((t) => t.poster?.startsWith("http"));
  } catch {
    return [];
  }
}
