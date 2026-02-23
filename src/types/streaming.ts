// Unified DTOs for titles and streaming sources (Watchmode + Streaming Availability)

export type TitleType = "movie" | "series";

export interface StreamingSource {
  providerId: string;
  providerName: string;
  type: "sub" | "rent" | "buy" | "free";
  price?: number;
  currency?: string;
  url?: string;
  quality?: "SD" | "HD" | "UHD" | "4K";
}

export interface UnifiedTitle {
  id: string;
  name: string;
  originalName?: string;
  type: TitleType;
  year?: number;
  poster?: string;
  backdrop?: string;
  overview?: string;        // plot/synopsis
  imdbRating?: number;      // 0-10
  rottenTomatoesRating?: number; // 0-100
  userRating?: number;      // Watchmode user rating 0-10
  criticScore?: number;     // Watchmode critic score 0-100
  runtime?: number;         // minutes
  genres?: string[];
  sources?: StreamingSource[];
  trailer?: string;
  // For series
  numberOfSeasons?: number;
}

export interface UnifiedSearchResult {
  titles: UnifiedTitle[];
  totalCount?: number;
}
