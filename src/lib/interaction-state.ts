import type { WatchStatus } from "@/types/library";

export const MAX_INTERACTION_BATCH_SIZE = 100;

export type InteractionState = {
  statuses: Record<string, WatchStatus>;
  listIdsByTitle: Record<string, string[]>;
  loadedStatusIds: string[];
  loadedMembershipIds: string[];
};

export type InteractionBatchKind = "watch-status" | "list-membership";

export function normalizeTitleIds(
  ids: readonly (string | null | undefined)[],
): string[] {
  return [
    ...new Set(ids.map((id) => id?.trim() ?? "").filter((id) => id.length > 0)),
  ];
}

export function chunkTitleIds(
  ids: readonly (string | null | undefined)[],
  maxSize = MAX_INTERACTION_BATCH_SIZE,
): string[][] {
  if (!Number.isInteger(maxSize) || maxSize < 1) {
    throw new Error("Batch size must be a positive integer");
  }
  const normalized = normalizeTitleIds(ids);
  const chunks: string[][] = [];
  for (let i = 0; i < normalized.length; i += maxSize) {
    chunks.push(normalized.slice(i, i + maxSize));
  }
  return chunks;
}

export function canonicalTitleIds(
  ids: readonly (string | null | undefined)[],
): string[] {
  return normalizeTitleIds(ids).sort();
}

export function parseTitleIdsParam(value: string | null): {
  ids: string[];
  error?: string;
} {
  const ids = normalizeTitleIds(value?.split(",") ?? []);
  if (ids.length > MAX_INTERACTION_BATCH_SIZE) {
    return {
      ids: [],
      error: `Maximum ${MAX_INTERACTION_BATCH_SIZE} title IDs per request`,
    };
  }
  return { ids };
}

export function mergeRecordMaps<T>(
  current: Record<string, T>,
  next: Record<string, T>,
): Record<string, T> {
  return { ...current, ...next };
}

export function mergeMembershipMaps(
  current: Record<string, string[]>,
  next: Record<string, string[]>,
): Record<string, string[]> {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).map(([titleId, listIds]) => [
        titleId,
        [...new Set(listIds)],
      ]),
    ),
  };
}

export function updateTitleStatus(
  statuses: Record<string, WatchStatus>,
  titleId: string,
  status: WatchStatus | null,
): Record<string, WatchStatus> {
  const next = { ...statuses };
  if (status === null) delete next[titleId];
  else next[titleId] = status;
  return next;
}

export function updateTitleMembership(
  listIdsByTitle: Record<string, string[]>,
  titleId: string,
  listId: string,
  action: "add" | "remove",
): Record<string, string[]> {
  const current = listIdsByTitle[titleId] ?? [];
  const next =
    action === "add"
      ? [...new Set([...current, listId])]
      : current.filter((id) => id !== listId);
  return { ...listIdsByTitle, [titleId]: next };
}
