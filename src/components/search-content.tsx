"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { TitleTile } from "@/components/title-tile";
import { PopularInfiniteGrid } from "@/components/popular-infinite-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UnifiedTitle } from "@/types/streaming";

type Props = {
  initialTitles: UnifiedTitle[];
  initialPage: number;
  initialHasMore: boolean;
  userProviderIds: string[];
};

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
  const [activeQuery, setActiveQuery] = useState(trimmed);
  const inputRef = useRef<HTMLInputElement>(null);

  if (trimmed !== activeQuery) {
    setActiveQuery(trimmed);
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
    fetch(`/api/titles/search?q=${encodeURIComponent(trimmed)}`)
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
  }, [trimmed]);

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
        className="mb-8 flex items-center gap-2"
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
      </form>

      {!searched ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
            Search
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Type a title above. Here&apos;s what&apos;s popular right now:
          </p>
          <PopularInfiniteGrid
            initialTitles={initialTitles}
            initialPage={initialPage}
            initialHasMore={initialHasMore}
            userProviderIds={userProviderIds}
          />
        </motion.section>
      ) : (
        <motion.section
          key={q}
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
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
              <p className="text-muted-foreground">
                No results for this search.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another title or keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {results.map((title) => (
                <TitleTile key={title.id} title={title} />
              ))}
            </div>
          )}
        </motion.section>
      )}
    </main>
  );
}
