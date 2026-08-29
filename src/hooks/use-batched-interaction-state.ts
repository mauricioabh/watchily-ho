import { useCallback, useEffect, useMemo } from "react";
import {
  useQueries,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  chunkTitleIds,
  MAX_INTERACTION_BATCH_SIZE,
  normalizeTitleIds,
} from "@/lib/interaction-state";
import {
  queryKeys,
  type MembershipResponse,
  type QueryScope,
  type WatchStatusResponse,
} from "@/lib/query";
import type { WatchStatus } from "@/types/library";

type Props = {
  titleIds: readonly string[];
  userId: QueryScope | undefined;
  initialStatuses?: Record<string, WatchStatus>;
  initialMemberships?: Record<string, string[]>;
  initialStatusIds?: readonly string[];
  initialMembershipIds?: readonly string[];
  enabled?: boolean;
};

function buildBatchUrl(path: string, parameter: string, ids: string[]): string {
  const params = new URLSearchParams({
    [parameter]: ids.join(","),
  });
  return `${path}?${params.toString()}`;
}

function getResolvedBatchIds(
  queryClient: QueryClient,
  kind: "watch-status-batch" | "list-membership-batch",
  userId: QueryScope | undefined,
  initialIds: readonly string[] | undefined,
  initialMap: Record<string, unknown>,
): Set<string> {
  const resolved = new Set(
    normalizeTitleIds(initialIds ?? Object.keys(initialMap)),
  );
  if (!userId) return resolved;
  for (const query of queryClient.getQueryCache().getAll()) {
    if (query.state.status !== "success" || query.queryKey[0] !== kind) {
      continue;
    }
    const input = query.queryKey[1];
    if (!input || typeof input !== "object" || Array.isArray(input)) continue;
    const queryUserId = (input as { userId?: QueryScope }).userId;
    if (queryUserId !== userId) continue;
    const titleIds = (input as { titleIds?: string[] }).titleIds;
    titleIds?.forEach((id) => resolved.add(id));
  }
  return resolved;
}

export function useBatchedInteractionState({
  titleIds,
  userId,
  initialStatuses = {},
  initialMemberships = {},
  initialStatusIds,
  initialMembershipIds,
  enabled = true,
}: Props) {
  const ids = useMemo(() => normalizeTitleIds(titleIds), [titleIds]);
  const queryClient = useQueryClient();
  const loadedStatusIds = getResolvedBatchIds(
    queryClient,
    "watch-status-batch",
    userId,
    initialStatusIds,
    initialStatuses,
  );
  const loadedMembershipIds = getResolvedBatchIds(
    queryClient,
    "list-membership-batch",
    userId,
    initialMembershipIds,
    initialMemberships,
  );
  const canRead = enabled && userId !== undefined && userId !== null;
  const unresolvedStatusIds = ids.filter((id) => !loadedStatusIds.has(id));
  const unresolvedMembershipIds = ids.filter(
    (id) => !loadedMembershipIds.has(id),
  );
  const statusBatches = useMemo(
    () => chunkTitleIds(unresolvedStatusIds, MAX_INTERACTION_BATCH_SIZE),
    [unresolvedStatusIds],
  );
  const membershipBatches = useMemo(
    () => chunkTitleIds(unresolvedMembershipIds, MAX_INTERACTION_BATCH_SIZE),
    [unresolvedMembershipIds],
  );
  const seededStatusBatches = useMemo(
    () =>
      chunkTitleIds(
        ids.filter((id) => loadedStatusIds.has(id)),
        MAX_INTERACTION_BATCH_SIZE,
      ),
    [ids, loadedStatusIds],
  );
  const seededMembershipBatches = useMemo(
    () =>
      chunkTitleIds(
        ids.filter((id) => loadedMembershipIds.has(id)),
        MAX_INTERACTION_BATCH_SIZE,
      ),
    [ids, loadedMembershipIds],
  );

  useEffect(() => {
    if (!canRead || !userId) return;
    for (const batch of chunkTitleIds(
      initialStatusIds ?? [],
      MAX_INTERACTION_BATCH_SIZE,
    )) {
      const statuses = Object.fromEntries(
        batch
          .filter((id) => initialStatuses[id] !== undefined)
          .map((id) => [id, initialStatuses[id]]),
      ) as WatchStatusResponse["statuses"];
      queryClient.setQueryData<WatchStatusResponse>(
        queryKeys.watchStatusBatch(batch, userId),
        { statuses },
      );
    }
    for (const batch of chunkTitleIds(
      initialMembershipIds ?? [],
      MAX_INTERACTION_BATCH_SIZE,
    )) {
      const listIdsByTitle = Object.fromEntries(
        batch.map((id) => [id, initialMemberships[id] ?? []]),
      );
      queryClient.setQueryData<MembershipResponse>(
        queryKeys.membershipBatch(batch, userId),
        { listIdsByTitle },
      );
    }
  }, [
    canRead,
    initialMembershipIds,
    initialMemberships,
    initialStatuses,
    initialStatusIds,
    queryClient,
    userId,
  ]);

  const statusQueries = useQueries({
    queries: [
      ...seededStatusBatches.map((batch) => ({
        queryKey: queryKeys.watchStatusBatch(batch, userId ?? null),
        queryFn: async (): Promise<WatchStatusResponse> => {
          const response = await fetch(
            buildBatchUrl("/api/watch-status", "ids", batch),
          );
          if (!response.ok) throw new Error("Could not load watch statuses");
          return (await response.json()) as WatchStatusResponse;
        },
        enabled: false,
        staleTime: 60_000,
      })),
      ...statusBatches.map((batch) => ({
        queryKey: queryKeys.watchStatusBatch(batch, userId ?? null),
        queryFn: async (): Promise<WatchStatusResponse> => {
          const response = await fetch(
            buildBatchUrl("/api/watch-status", "ids", batch),
          );
          if (!response.ok) throw new Error("Could not load watch statuses");
          return (await response.json()) as WatchStatusResponse;
        },
        enabled: canRead,
        staleTime: 60_000,
      })),
    ],
  });
  const membershipQueries = useQueries({
    queries: [
      ...seededMembershipBatches.map((batch) => ({
        queryKey: queryKeys.membershipBatch(batch, userId ?? null),
        queryFn: async (): Promise<MembershipResponse> => {
          const response = await fetch(
            buildBatchUrl("/api/lists/items", "title_ids", batch),
          );
          if (!response.ok) throw new Error("Could not load list memberships");
          return (await response.json()) as MembershipResponse;
        },
        enabled: false,
        staleTime: 60_000,
      })),
      ...membershipBatches.map((batch) => ({
        queryKey: queryKeys.membershipBatch(batch, userId ?? null),
        queryFn: async (): Promise<MembershipResponse> => {
          const response = await fetch(
            buildBatchUrl("/api/lists/items", "title_ids", batch),
          );
          if (!response.ok) throw new Error("Could not load list memberships");
          return (await response.json()) as MembershipResponse;
        },
        enabled: canRead,
        staleTime: 60_000,
      })),
    ],
  });

  const statuses = useMemo(() => {
    const next = { ...initialStatuses };
    statusQueries.forEach((query) => {
      Object.assign(next, query.data?.statuses ?? {});
    });
    return next;
  }, [initialStatuses, statusQueries]);
  const memberships = useMemo(() => {
    const next = { ...initialMemberships };
    membershipQueries.forEach((query) => {
      Object.assign(next, query.data?.listIdsByTitle ?? {});
    });
    return next;
  }, [initialMemberships, membershipQueries]);

  const resolvedStatusIds = loadedStatusIds;
  const resolvedMembershipIds = loadedMembershipIds;

  const retry = useCallback(async () => {
    await Promise.all([
      ...statusQueries.map((query) => query.refetch()),
      ...membershipQueries.map((query) => query.refetch()),
    ]);
  }, [membershipQueries, statusQueries]);

  return {
    ids,
    statuses,
    memberships,
    statusFor: (id: string): WatchStatus | null | undefined =>
      resolvedStatusIds.has(id) ? (statuses[id] ?? null) : undefined,
    membershipFor: (id: string): string[] | undefined =>
      resolvedMembershipIds.has(id) ? (memberships[id] ?? []) : undefined,
    statusKnown: (id: string) => resolvedStatusIds.has(id),
    membershipKnown: (id: string) => resolvedMembershipIds.has(id),
    isShared: canRead,
    isLoading:
      canRead &&
      (statusQueries.some((query) => query.isFetching) ||
        membershipQueries.some((query) => query.isFetching)),
    isError:
      statusQueries.some((query) => query.isError) ||
      membershipQueries.some((query) => query.isError),
    retry,
  };
}
