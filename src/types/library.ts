import type { UnifiedTitle } from "@/types/streaming";

export type WatchStatus = "watching" | "finished";

export type StatusFilter = "all" | WatchStatus;

export type TypeFilter = "all" | "movie" | "series";

export type TitleSortMode = "custom" | "asc" | "desc";

export type LibraryPrefs = {
  statusFilter: StatusFilter;
  titleSort: TitleSortMode;
};

export type ListSection = {
  id: string;
  name: string;
  titles: UnifiedTitle[];
};

export type StatusMap = Record<string, WatchStatus>;
