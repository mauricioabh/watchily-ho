import {
  QueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import type { UnifiedTitle } from "@/types/streaming";

export type QueryScope = string | null;

export type PopularQueryInput = {
  country: string;
  pageSize: number;
  providerIds: readonly string[];
  type: "movie" | "series" | "all";
  userId: QueryScope;
};

export type SearchQueryInput = {
  country: string;
  providerIds: readonly string[];
  query: string;
  type: "movie" | "series" | "all";
  userId: QueryScope;
};

export const queryKeys = {
  popular: (input: PopularQueryInput) =>
    [
      "popular",
      {
        country: input.country,
        pageSize: input.pageSize,
        providerIds: [...input.providerIds].sort(),
        type: input.type,
        userId: input.userId,
      },
    ] as const,
  search: (input: SearchQueryInput) =>
    [
      "search",
      {
        country: input.country,
        providerIds: [...input.providerIds].sort(),
        query: input.query,
        type: input.type,
        userId: input.userId,
      },
    ] as const,
  title: (titleId: string, country: string) =>
    ["title", { country, titleId }] as const,
  likes: (titleId: string, userId: QueryScope) =>
    ["likes", { titleId, userId }] as const,
  watchStatus: (titleId: string, userId: QueryScope) =>
    ["watch-status", { titleId, userId }] as const,
  lists: (userId: QueryScope) => ["lists", { userId }] as const,
  membership: (titleId: string, userId: QueryScope) =>
    ["list-membership", { titleId, userId }] as const,
  libraryEnrichment: (country: string, userId: QueryScope) =>
    ["library-enrichment", { country, userId }] as const,
};

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  });
}

export function isUserScopedKey(queryKey: QueryKey): boolean {
  return queryKey.some((part) => {
    if (!part || typeof part !== "object" || Array.isArray(part)) return false;
    return Object.prototype.hasOwnProperty.call(part, "userId");
  });
}

export function clearUserScopedCache(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => isUserScopedKey(query.queryKey),
  });
}

export type PagedTitlesResponse = {
  titles: UnifiedTitle[];
  page: number;
  hasMore: boolean;
};

export type SearchResponse = {
  titles: UnifiedTitle[];
  totalCount: number;
};

export type LibraryEnrichmentResponse = {
  titles: UnifiedTitle[];
};

export type ListResponse = {
  id: string;
  name: string;
};

export type MembershipResponse = {
  listIdsByTitle: Record<string, string[]>;
};

export type WatchStatusResponse = {
  statuses: Record<string, "watching" | "finished">;
};

export type LikesResponse = {
  likedIds: string[];
};

export type InfiniteTitles = InfiniteData<PagedTitlesResponse, number>;
