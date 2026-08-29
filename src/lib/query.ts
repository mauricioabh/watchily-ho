import {
  QueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import {
  canonicalTitleIds,
  updateTitleMembership,
  updateTitleStatus,
} from "@/lib/interaction-state";
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
  watchStatusBatch: (titleIds: readonly string[], userId: QueryScope) =>
    [
      "watch-status-batch",
      { titleIds: canonicalTitleIds(titleIds), userId },
    ] as const,
  membershipBatch: (titleIds: readonly string[], userId: QueryScope) =>
    [
      "list-membership-batch",
      { titleIds: canonicalTitleIds(titleIds), userId },
    ] as const,
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

function matchesUserScope(queryKey: QueryKey, userId: QueryScope): boolean {
  return queryKey.some(
    (part) =>
      part &&
      typeof part === "object" &&
      !Array.isArray(part) &&
      "userId" in part &&
      part.userId === userId,
  );
}

export function updateWatchStatusCaches(
  queryClient: QueryClient,
  userId: QueryScope,
  titleId: string,
  status: WatchStatusResponse["statuses"][string] | null,
): void {
  queryClient.setQueriesData<WatchStatusResponse>(
    {
      predicate: (query) => {
        if (!matchesUserScope(query.queryKey, userId)) return false;
        const [kind, input] = query.queryKey;
        if (kind === "watch-status") {
          return (input as { titleId?: string }).titleId === titleId;
        }
        if (kind === "watch-status-batch") {
          return (
            (input as { titleIds?: string[] }).titleIds?.includes(titleId) ??
            false
          );
        }
        return false;
      },
    },
    (previous) =>
      previous
        ? { statuses: updateTitleStatus(previous.statuses, titleId, status) }
        : previous,
  );
}

export function updateMembershipCaches(
  queryClient: QueryClient,
  userId: QueryScope,
  titleId: string,
  listId: string,
  action: "add" | "remove",
): void {
  queryClient.setQueriesData<MembershipResponse>(
    {
      predicate: (query) => {
        if (!matchesUserScope(query.queryKey, userId)) return false;
        const [kind, input] = query.queryKey;
        if (kind === "list-membership") {
          return (input as { titleId?: string }).titleId === titleId;
        }
        if (kind === "list-membership-batch") {
          return (
            (input as { titleIds?: string[] }).titleIds?.includes(titleId) ??
            false
          );
        }
        return false;
      },
    },
    (previous) =>
      previous
        ? {
            listIdsByTitle: updateTitleMembership(
              previous.listIdsByTitle,
              titleId,
              listId,
              action,
            ),
          }
        : previous,
  );
}
