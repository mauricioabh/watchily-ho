"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { TitleTile } from "@/components/title-tile";
import { useTranslations } from "next-intl";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { queryKeys, type PagedTitlesResponse } from "@/lib/query";
import { useBatchedInteractionState } from "@/hooks/use-batched-interaction-state";
import type { UnifiedTitle } from "@/types/streaming";

function buildPopularUrl(
  page: number,
  providerIds: readonly string[],
  type: "movie" | "series" | "all",
  country: string,
): string {
  const params = new URLSearchParams({
    country,
    page: String(page),
    providers: providerIds.join(","),
  });
  if (type !== "all") params.set("type", type);
  return `/api/titles/popular?${params.toString()}`;
}

export function PopularInfiniteGrid({
  initialTitles,
  initialPage,
  initialHasMore,
  userProviderIds,
  activeIds,
  typeFilter,
  userScope,
  country,
}: {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
  userProviderIds: string[];
  activeIds: string[];
  typeFilter?: "movie" | "series";
  userScope: string | null | undefined;
  country: string;
}) {
  const errors = useTranslations("errors");
  const type = typeFilter ?? "all";
  const isInitialFilter =
    !typeFilter &&
    activeIds.length === userProviderIds.length &&
    userProviderIds.every((id) => activeIds.includes(id));
  const initialData = useMemo<
    InfiniteData<PagedTitlesResponse, number> | undefined
  >(
    () =>
      isInitialFilter
        ? {
            pages: [
              {
                titles: filterTitlesByUserProviders(initialTitles, activeIds),
                page: initialPage,
                hasMore: initialHasMore,
              },
            ],
            pageParams: [initialPage],
          }
        : undefined,
    [activeIds, initialHasMore, initialPage, initialTitles, isInitialFilter],
  );

  const query = useInfiniteQuery({
    queryKey: queryKeys.popular({
      country,
      pageSize: 16,
      providerIds: activeIds,
      type,
      userId: userScope ?? null,
    }),
    queryFn: async ({ pageParam }): Promise<PagedTitlesResponse> => {
      const response = await fetch(
        buildPopularUrl(pageParam, activeIds, type, country),
      );
      if (!response.ok) throw new Error("Could not load popular titles");
      return (await response.json()) as PagedTitlesResponse;
    },
    initialPageParam: initialPage,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialData,
  });

  const titles = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.titles) ?? []).filter(
      (title) => {
        if (seen.has(title.id)) return false;
        seen.add(title.id);
        return true;
      },
    );
  }, [query.data?.pages]);
  const interaction = useBatchedInteractionState({
    titleIds: titles.map((title) => title.id),
    userId: userScope,
  });
  const hasMore = query.hasNextPage;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const intersectingRef = useRef(false);
  const loadMore = useCallback(() => {
    if (hasMore && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [hasMore, query]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = Boolean(entry?.isIntersecting);
        if (intersectingRef.current) loadMore();
      },
      { rootMargin: "600px 0px", threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const bootstrapping = query.isPending && titles.length === 0;
  const activeCount = activeIds.length;

  return (
    <div>
      {bootstrapping ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-2/3 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : titles.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
          <p className="text-muted-foreground">
            {activeCount === 0
              ? "Activa al menos una plataforma para ver títulos."
              : typeFilter
                ? `No hay ${typeFilter === "movie" ? "películas" : "series"} populares con los filtros actuales.`
                : "No hay contenido popular en las plataformas seleccionadas."}
          </p>
        </div>
      ) : (
        <>
          {interaction.isError ? (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
              role="alert"
            >
              <span>{errors("somethingWentWrong")}</span>
              <button
                type="button"
                className="rounded border border-white/15 px-2 py-1 hover:bg-white/10"
                onClick={() => void interaction.retry()}
              >
                {errors("retry")}
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {titles.map((title) => (
              <TitleTile
                key={title.id}
                title={title}
                watchStatus={interaction.statusFor(title.id)}
                showWatchStatus
                listIds={interaction.membershipFor(title.id) ?? []}
                membershipKnown={interaction.membershipKnown(title.id)}
                interactionStateShared={interaction.isShared}
                interactionLoading={interaction.isLoading}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 w-full" aria-hidden />
          {query.isFetchingNextPage ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-2/3 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : null}
          {query.error ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Error al cargar más. Desplázate de nuevo para reintentar.
            </p>
          ) : null}
          {!hasMore && !query.isFetchingNextPage ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No hay más títulos por ahora
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
