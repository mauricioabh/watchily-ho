"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TitleTile } from "@/components/title-tile";
import type { ListSection } from "@/app/lists/all/page";

interface Props {
  sections: ListSection[];
}

export function AllTitlesContent({ sections }: Props) {
  const [query, setQuery] = useState("");

  const totalUnique = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sections) for (const t of s.titles) seen.add(t.id);
    return seen.size;
  }, [sections]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, titles: s.titles.filter((t) => t.name.toLowerCase().includes(q)) }))
      .filter((s) => s.titles.length > 0);
  }, [sections, query]);

  const filteredTotal = useMemo(
    () => filteredSections.reduce((acc, s) => acc + s.titles.length, 0),
    [filteredSections]
  );

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-card/30 py-16 text-center">
        <p className="text-muted-foreground">Tus listas están vacías.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page title + total badge + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold">Todos mis títulos</h1>
          <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-0.5 text-sm font-semibold text-foreground/60">
            {totalUnique}
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9 pr-9 text-sm"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter feedback */}
      {query && (
        <p className="text-sm text-muted-foreground">
          {filteredTotal === 0
            ? `Sin resultados para "${query}"`
            : `${filteredTotal} ${filteredTotal === 1 ? "resultado" : "resultados"} para "${query}"`}
        </p>
      )}

      {/* No results */}
      {filteredSections.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-card/30 py-16 text-center">
          <p className="text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Sections */}
      {filteredSections.map((section) => (
        <section key={section.id} className="space-y-4">
          {/* Section header */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-foreground">{section.name}</h2>
            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs font-bold text-foreground/50">
              {section.titles.length} {section.titles.length === 1 ? "título" : "títulos"}
            </span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          {/* Tiles */}
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {section.titles.map((title) => (
              <TitleTile key={title.id} title={title} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
