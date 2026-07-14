"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TitleTile } from "@/components/title-tile";
import { ProviderFilterBar } from "@/components/provider-filter-bar";
import { useProviderFilter } from "@/hooks/use-provider-filter";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import type { UnifiedTitle } from "@/types/streaming";

type PopularPageResponse = {
  titles: UnifiedTitle[];
  page: number;
  hasMore: boolean;
};

const MAX_EMPTY_PAGES = 3;

function providersQuery(ids: string[]): string {
  return ids.length > 0
    ? `&providers=${encodeURIComponent(ids.join(","))}`
    : "&providers=";
}

export function PopularInfiniteGrid({
  initialTitles,
  initialPage,
  initialHasMore,
  userProviderIds,
}: {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
  userProviderIds: string[];
}) {
  const { activeIds, activeCount, totalCount, ready, toggle, setAll } =
    useProviderFilter(userProviderIds);

  const [titles, setTitles] = useState(() =>
    filterTitlesByUserProviders(initialTitles, userProviderIds),
  );
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const intersectingRef = useRef(false);
  const emptyStreakRef = useRef(0);
  const activeKeyRef = useRef(activeIds.slice().sort().join(","));
  const didHydrateFilterRef = useRef(false);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const fetchPage = useCallback(
    async (pageNum: number, providerIds: string[], replace: boolean) => {
      if (loadingRef.current && !replace) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/titles/popular?page=${pageNum}${providersQuery(providerIds)}`,
        );
        if (!res.ok) throw new Error("No se pudieron cargar más títulos");
        const data = (await res.json()) as PopularPageResponse;
        const incoming = data.titles ?? [];

        if (replace) {
          setTitles(incoming);
          emptyStreakRef.current = 0;
          setPage(data.page ?? pageNum);
          const nextHasMore = Boolean(data.hasMore);
          hasMoreRef.current = nextHasMore;
          setHasMore(nextHasMore);
          return;
        }

        let appendedCount = 0;
        setTitles((prev) => {
          const seen = new Set(prev.map((t) => t.id));
          const appended = incoming.filter((t) => !seen.has(t.id));
          appendedCount = appended.length;
          return appended.length ? [...prev, ...appended] : prev;
        });
        setPage(data.page ?? pageNum);

        if (appendedCount === 0) {
          emptyStreakRef.current += 1;
        } else {
          emptyStreakRef.current = 0;
        }

        const apiHasMore = Boolean(data.hasMore);
        const tooManyEmpty = emptyStreakRef.current >= MAX_EMPTY_PAGES;
        const nextHasMore = apiHasMore && !tooManyEmpty;
        hasMoreRef.current = nextHasMore;
        setHasMore(nextHasMore);
      } catch {
        setError("Error al cargar más. Desplázate de nuevo para reintentar.");
        if (!replace) {
          hasMoreRef.current = true;
          setHasMore(true);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  // After localStorage hydrate: if filter ≠ all subscribed, refetch page 1
  useEffect(() => {
    if (!ready || didHydrateFilterRef.current) return;
    didHydrateFilterRef.current = true;
    const key = activeIds.slice().sort().join(",");
    activeKeyRef.current = key;
    const isFull =
      activeIds.length === userProviderIds.length &&
      userProviderIds.every((id) => activeIds.includes(id));

    if (isFull) {
      setTitles(filterTitlesByUserProviders(initialTitles, activeIds));
      return;
    }

    setBootstrapping(true);
    void fetchPage(1, activeIds, true).finally(() => setBootstrapping(false));
  }, [ready, activeIds, userProviderIds, initialTitles, fetchPage]);

  // User toggled a chip → reset and refetch
  useEffect(() => {
    if (!ready || !didHydrateFilterRef.current) return;
    const key = activeIds.slice().sort().join(",");
    if (key === activeKeyRef.current) return;
    activeKeyRef.current = key;
    emptyStreakRef.current = 0;
    setBootstrapping(true);
    void fetchPage(1, activeIds, true).finally(() => setBootstrapping(false));
  }, [ready, activeIds, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current || bootstrapping) return;
    await fetchPage(pageRef.current + 1, activeIds, false);
  }, [fetchPage, activeIds, bootstrapping]);

  useEffect(() => {
    if (!hasMore || loading || bootstrapping || !intersectingRef.current)
      return;
    void loadMore();
  }, [hasMore, loading, bootstrapping, titles.length, loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = Boolean(entries[0]?.isIntersecting);
        intersectingRef.current = hit;
        if (hit) void loadMore();
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div>
      <ProviderFilterBar
        userProviderIds={userProviderIds}
        activeIds={activeIds}
        activeCount={activeCount}
        totalCount={totalCount}
        onToggle={toggle}
        onSelectAll={setAll}
      />

      {bootstrapping ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : titles.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
          <p className="text-muted-foreground">
            {activeCount === 0
              ? "Activa al menos una plataforma para ver títulos."
              : "No hay contenido popular en las plataformas seleccionadas."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {titles.map((title) => (
              <TitleTile key={title.id} title={title} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-10 w-full" aria-hidden />

          {loading && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-2/3 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {error}
            </p>
          )}

          {!hasMore && !loading && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No hay más títulos por ahora
            </p>
          )}
        </>
      )}
    </div>
  );
}
