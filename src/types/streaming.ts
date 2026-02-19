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
  overview?: string;
  imdbRating?: number;
  rottenTomatoesRating?: number; // 0-100
  runtime?: number; // minutes
  genres?: string[];
  sources?: StreamingSource[];
  // For series
  numberOfSeasons?: number;
}

export interface UnifiedSearchResult {
  titles: UnifiedTitle[];
  totalCount?: number;
}
