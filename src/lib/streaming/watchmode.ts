const WATCHMODE_BASE = "https://api.watchmode.com/v1";

export interface WatchmodeTitleResult {
  id: number;
  name: string;
  relevance?: number;
  type: string;
  year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  image?: string;
}

export interface WatchmodeSearchResponse {
  title_results: WatchmodeTitleResult[];
}

export interface WatchmodeAutocompleteResult {
  id: number;
  name: string;
  type: string;        // "movie" | "tv_series" | ...
  year?: number;
  relevance?: number;  // relevance score (higher = more relevant)
  result_type?: string;
  imdb_id?: string | null;
  tmdb_id?: number;
  tmdb_type?: string;
  image_url?: string;  // thumbnail CDN URL
}

export interface WatchmodeAutocompleteResponse {
  results: WatchmodeAutocompleteResult[];
}

export interface WatchmodeTitleDetails {
  id: number;
  title: string;          // API returns "title", not "name"
  original_title?: string;
  type: string;
  year?: number;
  end_year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  plot_overview?: string; // description/synopsis
  imdb_rating?: number;
  rotten_tomatoes?: number;
  user_rating?: number;   // 0-10
  critic_score?: number;  // 0-100
  runtime_minutes?: number;
  genre_names?: string[];
  us_rating?: string;
  poster?: string;
  posterMedium?: string;
  posterLarge?: string;
  backdrop?: string;
  trailer?: string;
  relevance_percentile?: number;
  popularity_percentile?: number;
  // Populated when append_to_response=sources is used
  sources?: WatchmodeSource[];
}

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string; // "sub", "rent", "buy", "free"
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format?: string;
  price?: number;
  currency?: string;
}

// NOTE: /title/{id}/sources/ returns a plain array, NOT an object with a "sources" key
export type WatchmodeSourcesResponse = WatchmodeSource[];

async function fetchWatchmode<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) throw new Error("WATCHMODE_API_KEY is not set");
  const url = new URL(`${WATCHMODE_BASE}${path}`);
  url.searchParams.set("apiKey", key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Watchmode API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function watchmodeSearch(
  query: string,
  types?: string[]
): Promise<WatchmodeSearchResponse> {
  const params: Record<string, string> = { search_field: "name", search_value: query };
  if (types?.length) params.types = types.join(",");
  return fetchWatchmode<WatchmodeSearchResponse>("/search/", params);
}

/**
 * Autocomplete search — returns results sorted by relevance score with thumbnails.
 * search_type=2 → titles only
 */
export async function watchmodeAutocompleteSearch(
  query: string
): Promise<WatchmodeAutocompleteResponse> {
  return fetchWatchmode<WatchmodeAutocompleteResponse>("/autocomplete-search/", {
    search_value: query,
    search_type: "2",
  });
}

/**
 * Watchmode supported region codes. Many countries (e.g. MX) are not supported.
 * Falls back to US when the user's country is not in this set.
 */
const WATCHMODE_SUPPORTED_REGIONS = new Set([
  "US", "CA", "GB", "AU", "NZ", "IE", "IN",
]);

export function toWatchmodeRegion(countryCode: string): string {
  const code = countryCode.toUpperCase();
  return WATCHMODE_SUPPORTED_REGIONS.has(code) ? code : "US";
}

/**
 * Fetch title details + sources in a single API call using append_to_response.
 * Falls back to US region if the provided region is not supported.
 */
export async function watchmodeTitleDetails(
  id: string,
  region = "US"
): Promise<WatchmodeTitleDetails | null> {
  const wmRegion = toWatchmodeRegion(region);
  try {
    return await fetchWatchmode<WatchmodeTitleDetails>(`/title/${id}/details/`, {
      append_to_response: "sources",
      regions: wmRegion,
    });
  } catch {
    return null;
  }
}

/** @deprecated Use watchmodeTitleDetails with append_to_response instead */
export async function watchmodeTitleSources(
  id: string,
  region = "US"
): Promise<WatchmodeSource[] | null> {
  const wmRegion = toWatchmodeRegion(region);
  try {
    const sources = await fetchWatchmode<WatchmodeSource[]>(`/title/${id}/sources/`, {
      regions: wmRegion,
    });
    return Array.isArray(sources) ? sources : null;
  } catch {
    return null;
  }
}

export interface WatchmodeListTitle {
  id: number;
  title: string;  // note: "title" not "name" in list-titles endpoint
  year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  type?: string;
  poster?: string | null;
}

export interface WatchmodeListResponse {
  titles: WatchmodeListTitle[];
  total_results?: number;
  total_pages?: number;
  page?: number;
}

/**
 * Get popular titles via /v1/list-titles/ sorted by popularity.
 * NOTE: /v1/trending/ does NOT exist in Watchmode API.
 */
export async function watchmodeListTitles(
  type: "movie" | "tv_series",
  options: { sortBy?: string; pageSize?: number; sourceIds?: number[] } = {}
): Promise<{ id: number; name: string; type: string; year?: number; image?: string }[]> {
  try {
    const key = process.env.WATCHMODE_API_KEY;
    if (!key) return [];
    const url = new URL(`${WATCHMODE_BASE}/list-titles/`);
    url.searchParams.set("apiKey", key);
    url.searchParams.set("types", type);
    url.searchParams.set("sort_by", options.sortBy ?? "popularity_desc");
    url.searchParams.set("page_size", String(options.pageSize ?? 20));
    if (options.sourceIds?.length) {
      url.searchParams.set("source_ids", options.sourceIds.join(","));
    }
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: WatchmodeListResponse = await res.json();
    return (data.titles ?? []).map((t) => ({
      id: t.id,
      name: t.title,
      type: t.type ?? type,
      year: t.year,
      image: t.poster ?? undefined,
    }));
  } catch {
    return [];
  }
}
