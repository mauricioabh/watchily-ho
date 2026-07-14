"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TitleTile } from "@/components/title-tile";
import { ProviderFilterBar } from "@/components/provider-filter-bar";
import { useProviderFilter } from "@/hooks/use-provider-filter";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import type { ListSection } from "@/app/lists/all/page";

interface Props {
  sections: ListSection[];
  userProviderIds: string[];
}

export function AllTitlesContent({ sections, userProviderIds }: Props) {
  const [query, setQuery] = useState("");
  const { activeIds, activeCount, totalCount, toggle, setAll } =
    useProviderFilter(userProviderIds);

  const providerFilteredSections = useMemo(() => {
    if (activeIds.length === 0) {
      return sections.map((s) => ({ ...s, titles: [] as typeof s.titles }));
    }
    return sections
      .map((s) => ({
        ...s,
        titles: filterTitlesByUserProviders(s.titles, activeIds),
      }))
      .filter((s) => s.titles.length > 0);
  }, [sections, activeIds]);

  const totalUnique = useMemo(() => {
    const seen = new Set<string>();
    for (const s of providerFilteredSections)
      for (const t of s.titles) seen.add(t.id);
    return seen.size;
  }, [providerFilteredSections]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providerFilteredSections;
    return providerFilteredSections
      .map((s) => ({
        ...s,
        titles: s.titles.filter((t) => t.name.toLowerCase().includes(q)),
      }))
      .filter((s) => s.titles.length > 0);
  }, [providerFilteredSections, query]);

  const filteredTotal = useMemo(
    () => filteredSections.reduce((acc, s) => acc + s.titles.length, 0),
    [filteredSections],
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold">Todos mis títulos</h1>
          <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-0.5 text-sm font-semibold text-foreground/60">
            {totalUnique}
          </span>
          {activeCount < totalCount && totalCount > 0 ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {activeCount}/{totalCount} plataformas
            </span>
          ) : null}
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

      <ProviderFilterBar
        userProviderIds={userProviderIds}
        activeIds={activeIds}
        activeCount={activeCount}
        totalCount={totalCount}
        onToggle={toggle}
        onSelectAll={setAll}
      />

      {query && (
        <p className="text-sm text-muted-foreground">
          {filteredTotal === 0
            ? `Sin resultados para "${query}"`
            : `${filteredTotal} ${filteredTotal === 1 ? "resultado" : "resultados"} para "${query}"`}
        </p>
      )}

      {activeCount === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-16 text-center">
          <p className="text-muted-foreground">
            Activa al menos una plataforma para ver títulos.
          </p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-16 text-center">
          <p className="text-muted-foreground">
            {query
              ? `Sin resultados para “${query}”`
              : "No hay títulos en las plataformas seleccionadas."}
          </p>
        </div>
      ) : (
        filteredSections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-foreground">
                {section.name}
              </h2>
              <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs font-bold text-foreground/50">
                {section.titles.length}{" "}
                {section.titles.length === 1 ? "título" : "títulos"}
              </span>
              <div className="h-px flex-1 bg-white/6" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {section.titles.map((title) => (
                <TitleTile key={title.id} title={title} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
