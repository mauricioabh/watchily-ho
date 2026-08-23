"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { TitleTile } from "@/components/title-tile";
import { PopularInfiniteGrid } from "@/components/popular-infinite-grid";
import { ProviderFilterBar } from "@/components/provider-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useProviderFilter } from "@/hooks/use-provider-filter";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import type { UnifiedTitle } from "@/types/streaming";

type Props = {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
  userProviderIds: string[];
};

function effectiveType(
  moviesOn: boolean,
  seriesOn: boolean,
): "movie" | "series" | undefined {
  if (moviesOn === seriesOn) return undefined;
  return moviesOn ? "movie" : "series";
}

export function SearchContent({
  initialTitles,
  initialPage,
  initialHasMore,
  userProviderIds,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const trimmed = q.trim();
  const searched = trimmed.length > 0;

  const [draft, setDraft] = useState(trimmed);
  const [results, setResults] = useState<UnifiedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moviesOn, setMoviesOn] = useState(true);
  const [seriesOn, setSeriesOn] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const { activeIds, activeCount, totalCount, toggle, setAll } =
    useProviderFilter(userProviderIds);

  const typeFilter = effectiveType(moviesOn, seriesOn);
  const searchKey = `${trimmed}|${typeFilter ?? "all"}`;
  const [activeSearchKey, setActiveSearchKey] = useState(searchKey);
  const filtersActive =
    (totalCount > 0 && activeCount < totalCount) || typeFilter !== undefined;

  const visibleResults = useMemo(() => {
    if (activeIds.length === 0) return [];
    return filterTitlesByUserProviders(results, activeIds);
  }, [results, activeIds]);

  if (searchKey !== activeSearchKey) {
    setActiveSearchKey(searchKey);
    setDraft(trimmed);
    setResults([]);
    setErrorMessage(null);
    setLoading(Boolean(trimmed));
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: false });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!trimmed) return;

    let cancelled = false;
    const typeParam = typeFilter ? `&type=${typeFilter}` : "";
    fetch(`/api/titles/search?q=${encodeURIComponent(trimmed)}${typeParam}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setResults(data.titles ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("We couldn't complete the search. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed, typeFilter]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = draft.trim();
    if (next) router.push(`/search?q=${encodeURIComponent(next)}`);
    else router.push("/search");
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <form
        onSubmit={submitSearch}
        className="mb-6 flex items-center gap-2"
        role="search"
      >
        <Input
          ref={inputRef}
          type="search"
          name="q"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Movies or series..."
          aria-label="Search movies or series"
          autoComplete="off"
          enterKeyHint="search"
          className="h-12 flex-1 rounded-xl border-white/10 bg-white/5 text-base placeholder:text-muted-foreground sm:h-11 sm:text-sm"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          className="h-12 shrink-0 rounded-xl px-4 sm:h-11"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-12 shrink-0 rounded-xl px-3 sm:h-11"
          aria-label="Filtros"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          {filtersActive ? (
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </Button>
      </form>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Tipo y plataformas. Los cambios se aplican al instante.
            </SheetDescription>
          </SheetHeader>

          <div className="mb-6 space-y-2.5">
            <span className="text-sm font-medium text-muted-foreground">
              Tipo
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={moviesOn}
                onClick={() => setMoviesOn((v) => !v)}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  moviesOn
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                aria-pressed={seriesOn}
                onClick={() => setSeriesOn((v) => !v)}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  seriesOn
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                Series
              </button>
            </div>
          </div>

          <ProviderFilterBar
            userProviderIds={userProviderIds}
            activeIds={activeIds}
            activeCount={activeCount}
            totalCount={totalCount}
            onToggle={toggle}
            onSelectAll={setAll}
          />
        </SheetContent>
      </Sheet>

      {!searched ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <PopularInfiniteGrid
            initialTitles={initialTitles}
            initialPage={initialPage}
            initialHasMore={initialHasMore}
            userProviderIds={userProviderIds}
            activeIds={activeIds}
            typeFilter={typeFilter}
          />
        </motion.section>
      ) : (
        <motion.section
          key={`${q}|${typeFilter ?? "all"}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            {loading ? "Searching…" : `Results for "${q}"`}
          </h1>
          {errorMessage ? (
            <p className="py-6 text-center text-destructive">{errorMessage}</p>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
              <p className="text-muted-foreground">
                {activeCount === 0
                  ? "Activa al menos una plataforma para ver resultados."
                  : "No results for this search."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeCount === 0
                  ? "Abre filtros y selecciona plataformas."
                  : "Try another title, keyword, or adjust filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {visibleResults.map((title) => (
                <TitleTile key={title.id} title={title} />
              ))}
            </div>
          )}
        </motion.section>
      )}
    </main>
  );
}
