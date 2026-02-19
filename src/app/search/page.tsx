"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TitleTile } from "@/components/title-tile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UnifiedTitle } from "@/types/streaming";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<UnifiedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/titles/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setResults(data.titles ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Buscar</h1>
      <form onSubmit={search} className="mb-6 flex gap-2">
        <Input
          placeholder="Películas o series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando…" : "Buscar"}
        </Button>
      </form>
      {searched && (
        <>
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground">No hay resultados.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.map((title) => (
                <TitleTile key={title.id} title={title} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="container px-4 py-8"><p className="text-muted-foreground">Cargando...</p></main>}>
      <SearchContent />
    </Suspense>
  );
}
