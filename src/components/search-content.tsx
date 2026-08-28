"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
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
import { captureProductEvent } from "@/lib/analytics";
import { queryKeys, type SearchResponse } from "@/lib/query";
import { normalizeSearchProviders, searchParsers } from "@/lib/url-state";
import { useAuthScope } from "@/components/app-providers";
import type { UnifiedTitle } from "@/types/streaming";

type Props = {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
  userProviderIds: string[];
  userScope: string | null;
  country: string;
};

export function SearchContent({
  initialTitles,
  initialPage,
  initialHasMore,
  userProviderIds,
  userScope,
  country,
}: Props) {
  const [urlState, setUrlState] = useQueryStates(searchParsers, {
    history: "push",
    shallow: true,
  });
  const t = useTranslations("search");
  const authScope = useAuthScope();
  const q = urlState.q;
  const trimmed = q.trim();
  const searched = trimmed.length > 0;
  const [draft, setDraft] = useState(trimmed);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    activeIds: localActiveIds,
    activeCount: localActiveCount,
    totalCount,
    toggle,
    setAll,
  } = useProviderFilter(userProviderIds);

  const typeFilter = urlState.type === "all" ? undefined : urlState.type;
  const moviesOn = urlState.type !== "series";
  const seriesOn = urlState.type !== "movie";
  const validUrlProviders = normalizeSearchProviders(
    urlState.providers,
    userProviderIds,
  );
  const activeIds =
    urlState.providers === null ? localActiveIds : validUrlProviders;
  const activeCount =
    urlState.providers === null ? localActiveCount : activeIds.length;
  const effectiveScope = authScope === undefined ? userScope : authScope;
  const filtersActive =
    (totalCount > 0 && activeCount < totalCount) || typeFilter !== undefined;

  const searchQuery = useQuery({
    queryKey: queryKeys.search({
      country,
      providerIds: activeIds,
      query: trimmed,
      type: urlState.type,
      userId: effectiveScope,
    }),
    queryFn: async (): Promise<SearchResponse> => {
      const params = new URLSearchParams({ q: trimmed, country });
      if (typeFilter) params.set("type", typeFilter);
      if (activeIds.length !== userProviderIds.length) {
        params.set("providers", activeIds.join(","));
      }
      const response = await fetch(`/api/titles/search?${params.toString()}`);
      if (response.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error("Search failed");
      return (await response.json()) as SearchResponse;
    },
    enabled: searched && effectiveScope !== undefined,
  });

  const visibleResults = useMemo(() => {
    if (activeIds.length === 0) return [];
    return filterTitlesByUserProviders(
      searchQuery.data?.titles ?? [],
      activeIds,
    );
  }, [activeIds, searchQuery.data?.titles]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: false });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    setDraft(trimmed);
  }, [trimmed]);

  useEffect(() => {
    if (urlState.providers === null) return;
    const normalized = normalizeSearchProviders(
      urlState.providers,
      userProviderIds,
    );
    if (normalized.join(",") !== urlState.providers.join(",")) {
      void setUrlState({ providers: normalized });
    }
  }, [setUrlState, urlState.providers, userProviderIds]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    captureProductEvent("search_submitted", {
      queryLength: Math.min(next.length, 200),
      type: urlState.type,
      providerCount: activeCount,
    });
    void setUrlState({ q: next || null });
  };

  const toggleType = (kind: "movie" | "series") => {
    const next =
      kind === "movie"
        ? urlState.type === "all"
          ? "series"
          : urlState.type === "movie"
            ? "all"
            : "series"
        : urlState.type === "all"
          ? "movie"
          : urlState.type === "series"
            ? "all"
            : "movie";
    void setUrlState({ type: next });
  };

  const toggleProvider = (id: string) => {
    if (!userProviderIds.includes(id)) return;
    const next = activeIds.includes(id)
      ? activeIds.filter((providerId) => providerId !== id)
      : [...activeIds, id];
    void setUrlState({ providers: next });
    if (urlState.providers === null) toggle(id);
  };

  const selectAllProviders = () => {
    void setUrlState({ providers: null });
    setAll();
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
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
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
          <span className="hidden sm:inline">{t("search")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-12 shrink-0 rounded-xl px-3 sm:h-11"
          aria-label={t("filters")}
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
            <SheetTitle>{t("filters")}</SheetTitle>
            <SheetDescription>{t("filterDescription")}</SheetDescription>
          </SheetHeader>
          <div className="mb-6 space-y-2.5">
            <span className="text-sm font-medium text-muted-foreground">
              {t("type")}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={moviesOn}
                onClick={() => toggleType("movie")}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${moviesOn ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
              >
                {t("movies")}
              </button>
              <button
                type="button"
                aria-pressed={seriesOn}
                onClick={() => toggleType("series")}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${seriesOn ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
              >
                {t("series")}
              </button>
            </div>
          </div>
          <ProviderFilterBar
            userProviderIds={userProviderIds}
            activeIds={activeIds}
            activeCount={activeCount}
            totalCount={totalCount}
            onToggle={toggleProvider}
            onSelectAll={selectAllProviders}
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
            userScope={effectiveScope}
            country={country}
          />
        </motion.section>
      ) : (
        <motion.section
          key={`${q}|${urlState.type}|${activeIds.join(",")}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            {searchQuery.isPending
              ? t("searching")
              : t("resultsFor", { query: q })}
          </h1>
          {searchQuery.error ? (
            <p className="py-6 text-center text-destructive">{t("error")}</p>
          ) : searchQuery.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
              <p className="text-muted-foreground">
                {activeCount === 0 ? t("selectPlatforms") : t("noResultsFor")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeCount === 0 ? t("selectPlatforms") : t("tryAnother")}
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
