// Streaming Availability API (movieofthenight)
// Direct: https://api.movieofthenight.com/v4 + X-API-Key (MOVIEOFTHENIGHT_API_KEY)
// RapidAPI fallback: STREAMING_AVAILABILITY_API_KEY / RAPIDAPI_KEY
// Docs: https://docs.movieofthenight.com/

import { env } from "@/env";

const DIRECT_BASE = "https://api.movieofthenight.com/v4";
const RAPIDAPI_HOST = "streaming-availability.p.rapidapi.com";

/** SA-backed availability: prefer long TTL to protect monthly quota (~1000). */
export const SA_FETCH_REVALIDATE_SECONDS = 86400;

interface SAService {
  id?: string;
  name?: string;
}

interface SAStreamingOption {
  type?: string;
  quality?: string;
  price?: { amount?: number | string; currency?: string };
  link?: string;
  service?: SAService;
}

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
  imageSet?: {
    verticalPoster?: Record<string, string>;
    horizontalPoster?: Record<string, string>;
    poster?: string;
    posterV?: string;
    backdrop?: string;
  };
  runtime?: number;
  genres?: { id?: number; name?: string }[];
  /** When `country` is set: map country → options[]. Each option has `service`. */
  streamingOptions?: Record<string, SAStreamingOption[]>;
}

type SaTransport =
  | { mode: "direct"; key: string }
  | { mode: "rapidapi"; key: string };

function resolveSaTransport(): SaTransport {
  const direct = env.MOVIEOFTHENIGHT_API_KEY;
  if (direct) return { mode: "direct", key: direct };
  const rapid = env.STREAMING_AVAILABILITY_API_KEY ?? env.RAPIDAPI_KEY;
  if (rapid) return { mode: "rapidapi", key: rapid };
  throw new Error(
    "MOVIEOFTHENIGHT_API_KEY or STREAMING_AVAILABILITY_API_KEY is not set",
  );
}

/** Best-effort monthly visibility in server logs (region correctness ≠ freshness). */
export function logSaRequest(path: string, country: string): void {
  console.info(
    `[sa] request path=${path} country=${country} at=${new Date().toISOString()}`,
  );
}

async function fetchStreamingAvailability<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const transport = resolveSaTransport();
  const base =
    transport.mode === "direct" ? DIRECT_BASE : `https://${RAPIDAPI_HOST}`;
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> =
    transport.mode === "direct"
      ? { "X-API-Key": transport.key }
      : {
          "X-RapidAPI-Key": transport.key,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        };

  logSaRequest(path, params.country ?? "*");

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: SA_FETCH_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Streaming Availability API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function mapOptionType(type?: string): "sub" | "rent" | "buy" | "free" {
  if (type === "subscription") return "sub";
  if (type === "rent") return "rent";
  if (type === "buy") return "buy";
  return "free";
}

function mapSAShowToUnified(
  show: SAShow,
  id: string,
): import("@/types/streaming").UnifiedTitle {
  const sources: import("@/types/streaming").StreamingSource[] = [];
  if (show.streamingOptions) {
    for (const options of Object.values(show.streamingOptions)) {
      for (const opt of options ?? []) {
        const providerId = opt.service?.id ?? "unknown";
        const providerName = opt.service?.name ?? providerId;
        const amount =
          typeof opt.price?.amount === "string"
            ? Number.parseFloat(opt.price.amount)
            : opt.price?.amount;
        sources.push({
          providerId,
          providerName,
          type: mapOptionType(opt.type),
          price: Number.isFinite(amount) ? amount : undefined,
          currency: opt.price?.currency,
          url: opt.link,
          quality: opt.quality?.toUpperCase() as
            | "SD"
            | "HD"
            | "UHD"
            | "4K"
            | undefined,
        });
      }
    }
  }
  const year = show.year ?? show.releaseYear;
  const poster =
    show.posterURLs?.original ??
    show.posterURLs?.["500"] ??
    show.imageSet?.verticalPoster?.w720 ??
    show.imageSet?.verticalPoster?.w600 ??
    show.imageSet?.poster ??
    show.imageSet?.posterV;
  const backdrop =
    show.backdropURLs?.original ??
    show.imageSet?.horizontalPoster?.w1440 ??
    show.imageSet?.backdrop;
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
    availabilitySource: "sa",
  };
}

export async function streamingAvailabilitySearch(
  query: string,
  country = "us",
): Promise<import("@/types/streaming").UnifiedTitle[]> {
  try {
    const data = await fetchStreamingAvailability<
      SAShow[] | { result?: SAShow[] }
    >("/shows/search/title", {
      title: query,
      country: country.toLowerCase(),
      output_language: "es",
    });
    const results = Array.isArray(data)
      ? data
      : ((data as { result?: SAShow[] }).result ?? []);
    return results
      .slice(0, 20)
      .map((show, i) =>
        mapSAShowToUnified(
          show,
          show.id ?? show.imdbId ?? show.tmdbId?.toString() ?? `sa-${i}`,
        ),
      );
  } catch {
    return [];
  }
}

/**
 * Fetch availability (+ metadata) by IMDb (`tt…`) or TMDB (`movie/123` | `tv/456`).
 * `appTitleId` is the Watchmode id kept as UnifiedTitle.id for app URLs.
 */
export async function streamingAvailabilityGetTitle(
  showId: string,
  country = "us",
  appTitleId?: string,
): Promise<import("@/types/streaming").UnifiedTitle | null> {
  try {
    const data = await fetchStreamingAvailability<SAShow | { result?: SAShow }>(
      `/shows/${encodeURIComponent(showId)}`,
      { country: country.toLowerCase() },
    );
    const show =
      (data as SAShow).title !== undefined
        ? (data as SAShow)
        : (data as { result?: SAShow }).result;
    if (!show) return null;
    const id =
      appTitleId ?? show.id ?? show.imdbId ?? show.tmdbId?.toString() ?? showId;
    return mapSAShowToUnified(show, id);
  } catch {
    return null;
  }
}
