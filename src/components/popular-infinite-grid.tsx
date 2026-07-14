"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TitleTile } from "@/components/title-tile";
import type { UnifiedTitle } from "@/types/streaming";

type PopularPageResponse = {
  titles: UnifiedTitle[];
  page: number;
  hasMore: boolean;
};

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

      setTitles((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        const appended = (data.titles ?? []).filter((t) => !seen.has(t.id));
        return appended.length ? [...prev, ...appended] : prev;
      });
      setPage(data.page ?? nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Error al cargar más. Desplázate de nuevo para reintentar.");
      hasMoreRef.current = true;
      setHasMore(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, titles.length]);

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

      <div ref={sentinelRef} className="h-8" aria-hidden />

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
