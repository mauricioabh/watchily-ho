"use client";

import { Eye, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WatchStatus } from "@/types/library";

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
  const watching = status === "watching";
  const finished = status === "finished";

  const setStatus = async (next: WatchStatus | null) => {
    const resolved =
      next === "watching" && watching
        ? null
        : next === "finished" && finished
          ? null
          : next;

    onChange?.(titleId, resolved);

    try {
      if (resolved === null) {
        await fetch(
          `/api/watch-status?title_id=${encodeURIComponent(titleId)}`,
          {
            method: "DELETE",
          },
        );
      } else {
        await fetch("/api/watch-status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title_id: titleId, status: resolved }),
        });
      }
    } catch {
      // Parent may revert via refresh; optimistic UI handled upstream
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
        title={watching ? "Remove from Watching" : "Mark as Watching"}
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
        title={finished ? "Remove from Finished" : "Mark as Finished"}
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
