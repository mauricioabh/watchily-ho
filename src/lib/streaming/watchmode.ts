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

export interface WatchmodeTitleDetails {
  id: number;
  name: string;
  original_name?: string;
  type: string;
  year?: number;
  end_year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  image?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  imdb_rating?: number;
  rotten_tomatoes?: number;
  runtime?: number;
  genre_names?: string[];
  us_rating?: string;
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

export interface WatchmodeSourcesResponse {
  id: number;
  title: string;
  sources: WatchmodeSource[];
}

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

export async function watchmodeTitleDetails(id: string): Promise<WatchmodeTitleDetails | null> {
  try {
    return await fetchWatchmode<WatchmodeTitleDetails>(`/title/${id}/details/`);
  } catch {
    return null;
  }
}

export async function watchmodeTitleSources(
  id: string,
  region = "US"
): Promise<WatchmodeSourcesResponse | null> {
  try {
    return await fetchWatchmode<WatchmodeSourcesResponse>(`/title/${id}/sources/`, {
      regions: region,
    });
  } catch {
    return null;
  }
}

// List popular: Watchmode has /v1/autocomplete/search/ or we use search with no query for trending - check docs. Fallback: use search "movie" or get from their list endpoint if any.
const WATCHMODE_TRENDING = "https://api.watchmode.com/v1/trending/";

export async function watchmodeTrending(
  type: "movies" | "series"
): Promise<{ id: number; name: string; type: string; year?: number; image?: string }[]> {
  try {
    const key = process.env.WATCHMODE_API_KEY;
    if (!key) return [];
    const url = `${WATCHMODE_TRENDING}${type}/?apiKey=${key}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.title_results ?? data?.results ?? [];
  } catch {
    return [];
  }
}
