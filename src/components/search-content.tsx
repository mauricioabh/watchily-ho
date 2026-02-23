"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TitleTile } from "@/components/title-tile";
import type { UnifiedTitle } from "@/types/streaming";

export function SearchContent({ popular }: { popular: UnifiedTitle[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<UnifiedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setSearched(false);
      setResults([]);
      return;
    }
    setLoading(true);
    setSearched(true);
    setErrorMessage(null);
    fetch(`/api/titles/search?q=${encodeURIComponent(q.trim())}`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setResults(data.titles ?? []);
      })
      .catch(() =>
        setErrorMessage("No pudimos completar la búsqueda. Intenta nuevamente.")
      )
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {!searched ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            Películas y series populares
          </h2>
          {popular.length === 0 ? (
            <p className="text-muted-foreground">Usa el buscador de arriba para encontrar títulos.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            {loading ? "Buscando…" : `Resultados para "${q}"`}
          </h2>
          {errorMessage ? (
            <p className="py-6 text-center text-destructive">{errorMessage}</p>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-card/30 py-10 text-center sm:py-12">
              <p className="text-muted-foreground">No hay resultados para esta búsqueda.</p>
              <p className="mt-2 text-sm text-muted-foreground">Prueba con otro título o término.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
