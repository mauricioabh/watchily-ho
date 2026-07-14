"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { TitleTile } from "@/components/title-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UnifiedTitle } from "@/types/streaming";

export function SearchContent({ popular }: { popular: UnifiedTitle[] }) {
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

  // Keep local draft in sync with the URL query (render-time adjust).
  if (trimmed !== activeQuery) {
    setActiveQuery(trimmed);
    setDraft(trimmed);
    setResults([]);
    setErrorMessage(null);
    setLoading(Boolean(trimmed));
  }

  useEffect(() => {
    // Mobile: lupa lands here — focus the field and open the keyboard.
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
          setErrorMessage(
            "No pudimos completar la búsqueda. Intenta nuevamente.",
          );
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
          placeholder="Películas o series..."
          aria-label="Buscar películas o series"
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
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </form>

      {!searched ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
            Buscar
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Escribe un título arriba. Mientras tanto, esto es lo popular ahora:
          </p>
          {popular.length === 0 ? (
            <p className="text-muted-foreground">
              Usa el buscador para encontrar películas y series.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {popular.map((title) => (
                <TitleTile key={title.id} title={title} />
              ))}
            </div>
          )}
        </motion.section>
      ) : (
        <motion.section
          key={q}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            {loading ? "Buscando…" : `Resultados para "${q}"`}
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
                No hay resultados para esta búsqueda.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Prueba con otro título o término.
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
