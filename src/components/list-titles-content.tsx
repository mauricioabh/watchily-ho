"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TitleTile } from "@/components/title-tile";
import { ProviderFilterBar } from "@/components/provider-filter-bar";
import { ListActions } from "@/components/list-actions";
import { Button } from "@/components/ui/button";
import { useProviderFilter } from "@/hooks/use-provider-filter";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import type { StatusMap, WatchStatus } from "@/types/library";
import type { UnifiedTitle } from "@/types/streaming";

type Props = {
  listId: string;
  listName: string;
  titles: UnifiedTitle[];
  userProviderIds: string[];
  statusMap: StatusMap;
  filterType?: string;
};

export function ListTitlesContent({
  listId,
  listName,
  titles,
  userProviderIds,
  statusMap: initialStatusMap,
  filterType,
}: Props) {
  const router = useRouter();
  const [statusMap, setStatusMap] = useState<StatusMap>(initialStatusMap);
  const { activeIds, activeCount, totalCount, toggle, setAll } =
    useProviderFilter(userProviderIds);

  useEffect(() => {
    setStatusMap(initialStatusMap);
  }, [initialStatusMap]);

  const handleStatusChange = useCallback(
    (titleId: string, status: WatchStatus | null) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        if (status === null) delete next[titleId];
        else next[titleId] = status;
        return next;
      });
    },
    [],
  );

  const visible = useMemo(() => {
    if (activeIds.length === 0) return [];
    return filterTitlesByUserProviders(titles, activeIds);
  }, [titles, activeIds]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{listName}</h1>
          <p className="text-muted-foreground">
            {visible.length} {visible.length === 1 ? "title" : "titles"}
            {activeCount < totalCount && totalCount > 0 ? (
              <span className="ml-1.5 text-foreground/45">
                (filtered · {activeCount}/{totalCount} platforms)
              </span>
            ) : null}
          </p>
        </div>
        <ListActions listId={listId} listName={listName} />
      </div>

      <ProviderFilterBar
        userProviderIds={userProviderIds}
        activeIds={activeIds}
        activeCount={activeCount}
        totalCount={totalCount}
        onToggle={toggle}
        onSelectAll={setAll}
      />

      <div className="mb-4 flex gap-2">
        <Link href={`/lists/${listId}`}>
          <Button variant={!filterType ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        <Link href={`/lists/${listId}?type=movie`}>
          <Button
            variant={filterType === "movie" ? "default" : "outline"}
            size="sm"
          >
            Movies
          </Button>
        </Link>
        <Link href={`/lists/${listId}?type=series`}>
          <Button
            variant={filterType === "series" ? "default" : "outline"}
            size="sm"
          >
            Series
          </Button>
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center">
          <p className="text-muted-foreground">
            {activeCount === 0
              ? "Enable at least one platform to see titles."
              : "No titles on the selected platforms."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((title) => (
            <TitleTile
              key={title.id}
              title={title}
              watchStatus={statusMap[title.id]}
              showWatchStatus
              onWatchStatusChange={handleStatusChange}
              onListsChange={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </>
  );
}
