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
    url: s.web_url ?? s.ios_url ?? s.android_url,
    quality: s.format as StreamingSource["quality"],
  }));
  return {
    id: String(d.id),
    name: d.name,
    originalName: d.original_name,
    type: d.type === "tv_series" ? "series" : "movie",
    year: d.year,
    poster: d.poster ?? d.image,
    backdrop: d.backdrop,
    overview: d.overview,
    imdbRating: d.imdb_rating,
    rottenTomatoesRating: d.rotten_tomatoes,
    runtime: d.runtime,
    genres: d.genre_names,
    sources: src.length ? src : undefined,
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

export async function searchTitles(
  query: string,
  options?: { types?: ("movie" | "series")[]; country?: string }
): Promise<UnifiedSearchResult> {
  const types = options?.types?.map((t) => (t === "series" ? "tv_series" : "movie"));
  try {
    const res = await watchmode.watchmodeSearch(query, types);
    const titles = (res.title_results ?? []).map(mapWatchmodeResultToUnified);
    return { titles, totalCount: titles.length };
  } catch {
    const country = options?.country ?? "us";
    const titles = await streamingAvailability.streamingAvailabilitySearch(query, country);
    return { titles, totalCount: titles.length };
  }
}

export async function getTitleDetails(
  id: string,
  options?: { region?: string; country?: string }
): Promise<UnifiedTitle | null> {
  const region = options?.region ?? options?.country ?? "US";
  try {
    const [details, sourcesRes] = await Promise.all([
      watchmode.watchmodeTitleDetails(id),
      watchmode.watchmodeTitleSources(id, region),
    ]);
    if (details) {
      return mapWatchmodeDetailsToUnified(details, sourcesRes?.sources);
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
}): Promise<UnifiedTitle[]> {
  const type = options?.type ?? "movie";
  try {
    const list = await watchmode.watchmodeTrending(type === "movie" ? "movies" : "series");
    return list.map((t) => ({
      id: String(t.id),
      name: t.name,
      type: type === "movie" ? "movie" : "series",
      year: t.year,
      poster: t.image,
    }));
  } catch {
    return [];
  }
}
