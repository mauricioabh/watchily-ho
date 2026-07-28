import type { UnifiedTitle } from "@/types/streaming";

export type WatchStatus = "watching" | "finished";

export type ListSection = {
  id: string;
  name: string;
  titles: UnifiedTitle[];
};

export type StatusMap = Record<string, WatchStatus>;
