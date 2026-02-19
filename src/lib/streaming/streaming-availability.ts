// Fallback: Streaming Availability API (RapidAPI)
// Docs: https://docs.movieofthenight.com/ - use RapidAPI key and host

const RAPIDAPI_HOST = "streaming-availability.p.rapidapi.com";

interface SAStreamingOption {
  type?: string; // "subscription" | "rent" | "buy" | "addon"
  quality?: string;
  price?: { amount?: number; currency?: string };
  link?: string;
  audios?: { language?: string }[];
  subtitles?: { language?: string }[];
}

interface SAShow {
  imdbId?: string;
  tmdbId?: number;
  type?: "movie" | "series";
  title?: string;
  originalTitle?: string;
  year?: number;
  overview?: string;
  imdbRating?: number;
  metacriticRating?: number;
  posterURLs?: { original?: string; "500"?: string };
  backdropURLs?: { original?: string };
  runtime?: number;
  genres?: { id?: number; name?: string }[];
  streamingOptions?: Record<string, SAStreamingOption[]>;
}

interface SASearchResponse {
  result?: SAShow[];
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
  return {
    id,
    name: show.title ?? "",
    originalName: show.originalTitle,
    type: (show.type as "movie" | "series") ?? "movie",
    year: show.year,
    poster: show.posterURLs?.original ?? show.posterURLs?.["500"],
    backdrop: show.backdropURLs?.original,
    overview: show.overview,
    imdbRating: show.imdbRating,
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
    const data = await fetchStreamingAvailability<SASearchResponse>("/search/title", {
      title: query,
      country,
      output_language: "es",
    });
    const results = data.result ?? [];
    return results.slice(0, 20).map((show, i) =>
      mapSAShowToUnified(show, show.imdbId ?? show.tmdbId?.toString() ?? `sa-${i}`)
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
    const data = await fetchStreamingAvailability<{ result?: SAShow }>("/get/basic_details", {
      imdb_id: imdbId,
      country,
    });
    const show = data.result;
    if (!show) return null;
    return mapSAShowToUnified(show, imdbId);
  } catch {
    return null;
  }
}
