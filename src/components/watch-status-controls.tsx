"use client";

import { Eye, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { captureProductEvent } from "@/lib/analytics";
import {
  getMutationErrorMessage,
  requireSuccessfulResponse,
} from "@/lib/mutation-feedback";
import type { WatchStatus } from "@/types/library";
import { useAuthScope } from "@/components/app-providers";
import { queryKeys, type WatchStatusResponse } from "@/lib/query";

type Props = {
  titleId: string;
  status?: WatchStatus | null;
  onChange?: (titleId: string, status: WatchStatus | null) => void;
  compact?: boolean;
};

export function WatchStatusControls({
  titleId,
  status,
  onChange,
  compact = false,
}: Props) {
  const t = useTranslations("library");
  const queryClient = useQueryClient();
  const authScope = useAuthScope();
  const statusQuery = useQuery({
    queryKey: queryKeys.watchStatus(titleId, authScope ?? null),
    queryFn: async (): Promise<WatchStatusResponse> =>
      (
        await fetch(`/api/watch-status?ids=${encodeURIComponent(titleId)}`)
      ).json(),
    enabled: status === undefined && authScope !== undefined,
  });
  const currentStatus =
    status !== undefined
      ? status
      : (statusQuery.data?.statuses[titleId] ?? null);
  const watching = currentStatus === "watching";
  const finished = currentStatus === "finished";
  const mutation = useMutation({
    mutationKey: ["watch-status", titleId, authScope],
    mutationFn: async (resolved: WatchStatus | null) => {
      const response =
        resolved === null
          ? await fetch(
              `/api/watch-status?title_id=${encodeURIComponent(titleId)}`,
              { method: "DELETE" },
            )
          : await fetch("/api/watch-status", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title_id: titleId, status: resolved }),
            });
      await requireSuccessfulResponse(response, t("updateStatusError"));
      return resolved;
    },
    onSuccess: (resolved) => {
      queryClient.setQueryData<WatchStatusResponse>(
        queryKeys.watchStatus(titleId, authScope ?? null),
        { statuses: resolved ? { [titleId]: resolved } : {} },
      );
      void queryClient.invalidateQueries({ queryKey: ["watch-status"] });
    },
  });

  const setStatus = async (next: WatchStatus | null) => {
    const previous = currentStatus;
    const resolved =
      next === "watching" && watching
        ? null
        : next === "finished" && finished
          ? null
          : next;

    onChange?.(titleId, resolved);

    try {
      await mutation.mutateAsync(resolved);
      captureProductEvent("watch_status_changed", {
        status: resolved ?? "removed",
      });
      toast.success(
        resolved === "watching"
          ? t("watching")
          : resolved === "finished"
            ? t("finished")
            : t("status"),
      );
    } catch (error) {
      onChange?.(titleId, previous);
      toast.error(getMutationErrorMessage(error, t("updateStatusError")));
    }
  };

  const btnClass = compact
    ? "h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm"
    : "h-9 w-9";

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          btnClass,
          "transition-all duration-150 hover:scale-110 hover:bg-black/85",
          watching && "ring-2 ring-sky-400/70",
        )}
        title={watching ? t("removeWatching") : t("markWatching")}
        aria-pressed={watching}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void setStatus("watching");
        }}
      >
        <Eye
          className={cn(
            compact ? "h-4 w-4" : "h-4 w-4",
            watching ? "text-sky-400" : "text-foreground/80",
          )}
        />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          btnClass,
          "transition-all duration-150 hover:scale-110 hover:bg-black/85",
          finished && "ring-2 ring-emerald-400/70",
        )}
        title={finished ? t("removeFinished") : t("markFinished")}
        aria-pressed={finished}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void setStatus("finished");
        }}
      >
        <CircleCheck
          className={cn(
            compact ? "h-4 w-4" : "h-4 w-4",
            finished ? "text-emerald-400" : "text-foreground/80",
          )}
        />
      </Button>
    </div>
  );
}
