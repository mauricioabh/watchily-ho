"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TitleTile } from "@/components/title-tile";
import type { UnifiedTitle } from "@/types/streaming";

type PopularPageResponse = {
  titles: UnifiedTitle[];
  page: number;
  hasMore: boolean;
};

const MAX_EMPTY_PAGES = 3;

export function PopularInfiniteGrid({
  initialTitles,
  initialPage,
  initialHasMore,
}: {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
}) {
  const [titles, setTitles] = useState(initialTitles);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const intersectingRef = useRef(false);
  const emptyStreakRef = useRef(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const nextPage = pageRef.current + 1;
    try {
      const res = await fetch(`/api/titles/popular?page=${nextPage}`);
      if (!res.ok) throw new Error("No se pudieron cargar más títulos");
      const data = (await res.json()) as PopularPageResponse;
      const incoming = data.titles ?? [];

      let appendedCount = 0;
      setTitles((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        const appended = incoming.filter((t) => !seen.has(t.id));
        appendedCount = appended.length;
        return appended.length ? [...prev, ...appended] : prev;
      });
      setPage(data.page ?? nextPage);

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
      hasMoreRef.current = true;
      setHasMore(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Mobile: sentinel often stays intersecting after a page loads — keep going.
  useEffect(() => {
    if (!hasMore || loading || !intersectingRef.current) return;
    void loadMore();
  }, [hasMore, loading, titles.length, loadMore]);

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

  if (titles.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
        <p className="text-muted-foreground">
          No hay contenido popular en tus plataformas por ahora.
        </p>
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}
