// Fallback: Streaming Availability API (RapidAPI)
// Docs: https://docs.movieofthenight.com/ — auth: X-RapidAPI-Key (env: STREAMING_AVAILABILITY_API_KEY o RAPIDAPI_KEY)

const RAPIDAPI_HOST = "streaming-availability.p.rapidapi.com";

interface SAStreamingOption {
  type?: string; // "subscription" | "rent" | "buy" | "addon"
  quality?: string;
  price?: { amount?: number; currency?: string };
  link?: string;
  audios?: { language?: string }[];
  subtitles?: { language?: string }[];
}

// API v3: imageSet, releaseYear, rating. Older: posterURLs, year, imdbRating.
interface SAShow {
  id?: string;
  imdbId?: string;
  tmdbId?: number;
  showType?: "movie" | "series";
  type?: "movie" | "series";
  title?: string;
  originalTitle?: string;
  year?: number;
  releaseYear?: number;
  overview?: string;
  imdbRating?: number;
  rating?: number;
  metacriticRating?: number;
  posterURLs?: { original?: string; "500"?: string };
  backdropURLs?: { original?: string };
  imageSet?: { poster?: string; posterV?: string; backdrop?: string };
  runtime?: number;
  genres?: { id?: number; name?: string }[];
  streamingOptions?: Record<string, SAStreamingOption[]>;
}

async function fetchStreamingAvailability<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.STREAMING_AVAILABILITY_API_KEY ?? process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("STREAMING_AVAILABILITY_API_KEY or RAPIDAPI_KEY is not set");
  const url = new URL(`https://${RAPIDAPI_HOST}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Streaming Availability API error: ${res.status}`);
  return res.json() as Promise<T>;
}

function mapSAShowToUnified(show: SAShow, id: string): import("@/types/streaming").UnifiedTitle {
  const sources: import("@/types/streaming").StreamingSource[] = [];
  if (show.streamingOptions) {
    for (const [provider, options] of Object.entries(show.streamingOptions)) {
      for (const opt of options ?? []) {
        const type =
          opt.type === "subscription"
            ? "sub"
            : opt.type === "rent"
              ? "rent"
              : opt.type === "buy"
                ? "buy"
                : "free";
        sources.push({
          providerId: provider,
          providerName: provider,
          type: type as "sub" | "rent" | "buy" | "free",
          price: opt.price?.amount,
          currency: opt.price?.currency,
          url: opt.link,
          quality: opt.quality as "SD" | "HD" | "UHD" | "4K" | undefined,
        });
      }
    }
  }
  const year = show.year ?? show.releaseYear;
  const poster =
    show.posterURLs?.original ??
    show.posterURLs?.["500"] ??
    show.imageSet?.poster ??
    show.imageSet?.posterV;
  const backdrop = show.backdropURLs?.original ?? show.imageSet?.backdrop;
  const rating = show.imdbRating ?? show.rating;

  return {
    id,
    name: show.title ?? "",
    originalName: show.originalTitle,
    type: ((show.showType ?? show.type) as "movie" | "series") ?? "movie",
    year: year ?? undefined,
    poster,
    backdrop,
    overview: show.overview,
    imdbRating: rating,
    rottenTomatoesRating: show.metacriticRating,
    runtime: show.runtime,
    genres: show.genres?.map((g) => g.name ?? "").filter(Boolean),
    sources: sources.length ? sources : undefined,
  };
}

export async function streamingAvailabilitySearch(
  query: string,
  country = "us"
): Promise<import("@/types/streaming").UnifiedTitle[]> {
  try {
    // API: GET /shows/search/title?title=...&country=...&output_language=es
    const data = await fetchStreamingAvailability<SAShow[] | { result?: SAShow[] }>(
      "/shows/search/title",
      { title: query, country, output_language: "es" }
    );
    const results = Array.isArray(data) ? data : (data as { result?: SAShow[] }).result ?? [];
    return results.slice(0, 20).map((show, i) =>
      mapSAShowToUnified(show, show.id ?? show.imdbId ?? show.tmdbId?.toString() ?? `sa-${i}`)
    );
  } catch {
    return [];
  }
}

export async function streamingAvailabilityGetTitle(
  imdbId: string,
  country = "us"
): Promise<import("@/types/streaming").UnifiedTitle | null> {
  try {
    // API: GET /shows/{id}?country=... (id = IMDb tt... o TMDB movie/123 | tv/456)
    const data = await fetchStreamingAvailability<SAShow | { result?: SAShow }>(
      `/shows/${encodeURIComponent(imdbId)}`,
      { country }
    );
    const show = (data as SAShow).title !== undefined ? (data as SAShow) : (data as { result?: SAShow }).result;
    if (!show) return null;
    return mapSAShowToUnified(show, show.id ?? show.imdbId ?? imdbId);
  } catch {
    return null;
  }
}
