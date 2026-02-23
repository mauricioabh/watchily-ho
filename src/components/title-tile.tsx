"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import { SiAppletv, SiCrunchyroll, SiPrimevideo, SiParamountplus } from "react-icons/si";
import type { UnifiedTitle, StreamingSource } from "@/types/streaming";
import { cn } from "@/lib/utils";

const API_BASE = "";

/* ── Platform icon matcher ── */
type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
interface PlatformDef { Icon: IconComponent; color: string; label: string }

const PLATFORMS: [RegExp, PlatformDef][] = [
  [/netflix/i,    { Icon: TbBrandNetflix,  color: "#E50914", label: "Netflix" }],
  [/disney/i,     { Icon: TbBrandDisney,   color: "#113CCF", label: "Disney+" }],
  [/\b(hbo|max)\b/i, { Icon: TbBrandHbo,  color: "#B535F6", label: "HBO Max" }],
  [/\b(prime|amazon)\b/i, { Icon: SiPrimevideo, color: "#00A8E1", label: "Prime Video" }],
  [/apple/i,      { Icon: SiAppletv,       color: "#FFFFFF", label: "Apple TV+" }],
  [/crunchyroll/i,{ Icon: SiCrunchyroll,   color: "#F47521", label: "Crunchyroll" }],
  [/paramount/i,  { Icon: SiParamountplus, color: "#0064FF", label: "Paramount+" }],
];

function getPlatformDef(name: string): PlatformDef | null {
  for (const [re, def] of PLATFORMS) {
    if (re.test(name)) return def;
  }
  return null;
}

/* ── Deduplicated subscription sources only ── */
function getSubscriptionSources(sources: StreamingSource[]): StreamingSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (s.type !== "sub") return false;
    const key = s.providerName.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── IMDb logo badge ── */
function ImdbBadge({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 rounded bg-[#f5c518] px-1.5 py-0.5 text-[11px] font-bold leading-none text-black">
      IMDb {rating.toFixed(1)}
    </span>
  );
}

/* ── Rotten Tomatoes badge ── */
function RTBadge({ rating }: { rating: number }) {
  const fresh = rating >= 60;
  return (
    <span className={cn(
      "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold leading-none",
      fresh ? "bg-red-600 text-white" : "bg-zinc-600 text-white"
    )}>
      {fresh ? "🍅" : "🥦"} {rating}%
    </span>
  );
}

/* ── Lists dialog ── */
function BookmarkDialog({ title }: { title: UnifiedTitle }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [listIdsForTitle, setListIdsForTitle] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  // Check on mount if the title is already in any list (so icon shows correctly)
  useEffect(() => {
    fetch(`${API_BASE}/api/lists/items?title_id=${title.id}`)
      .then((r) => r.json())
      .then((d) => setListIdsForTitle(d.listIdsByTitle?.[title.id] ?? []))
      .catch(() => {});
  }, [title.id]);

  // When dialog opens, also load the full list of lists
  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/api/lists`)
      .then((r) => r.json())
      .then((d) => setLists(d.lists ?? []))
      .catch(() => {});
  }, [open]);

  const addToList = async (listId: string) => {
    await fetch(`${API_BASE}/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title_id: title.id, title_type: title.type }),
    });
    setListIdsForTitle((prev) => (prev.includes(listId) ? prev : [...prev, listId]));
  };

  const removeFromList = async (listId: string) => {
    await fetch(`${API_BASE}/api/lists/${listId}/items?title_id=${title.id}`, { method: "DELETE" });
    setListIdsForTitle((prev) => prev.filter((id) => id !== listId));
  };

  const createListAndAdd = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim(), is_public: false }),
      });
      const created = await res.json();
      if (created.id) {
        await addToList(created.id);
        setLists((prev) => [...prev, { id: created.id, name: created.name }]);
        setNewListName("");
      }
    } finally {
      setCreating(false);
    }
  };

  const inAnyList = listIdsForTitle.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full bg-black/60 backdrop-blur-sm transition-all duration-150 hover:scale-110 hover:bg-black/85 hover:ring-2 hover:ring-primary/60"
          title="Añadir a lista"
        >
          {inAnyList
            ? <BookmarkCheck className="h-4 w-4 text-primary" />
            : <Bookmark className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir a lista</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground truncate">{title.name}</p>

        {lists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Aún no tienes listas. Crea una abajo.</p>
        ) : (
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {lists.map((list) => {
              const inList = listIdsForTitle.includes(list.id);
              return (
                <div
                  key={list.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 px-3 py-2"
                >
                  <span className="text-sm">{list.name}</span>
                  <Button
                    variant={inList ? "destructive" : "default"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => inList ? removeFromList(list.id) : addToList(list.id)}
                  >
                    {inList ? "Quitar" : "Añadir"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Input
            placeholder="Nueva lista..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createListAndAdd()}
            className="h-9 text-sm"
          />
          <Button
            onClick={createListAndAdd}
            disabled={!newListName.trim() || creating}
            size="sm"
            className="h-9 shrink-0"
          >
            Crear y añadir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main tile ── */
export function TitleTile({ title }: { title: UnifiedTitle }) {
  const posterUrl = title.poster?.startsWith("http") ? title.poster : undefined;
  const subSources = title.sources ? getSubscriptionSources(title.sources) : [];
  const firstSource = title.sources?.find((s) => s.url);
  const hasInfo = title.imdbRating != null || title.rottenTomatoesRating != null || subSources.length > 0;

  // Use first platform's color for the hover glow
  const firstPlatformColor =
    subSources.length > 0 ? (getPlatformDef(subSources[0].providerName)?.color ?? "#6366f1") : "#6366f1";

  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{
        scale: 1.03,
        borderColor: `${firstPlatformColor}90`,
        boxShadow: `0 0 0 1px ${firstPlatformColor}50, 0 10px 40px ${firstPlatformColor}35`,
      }}
    >
      {/* Poster */}
      <div className="relative aspect-2/3 overflow-hidden bg-muted">
        <Link href={`/title/${title.id}`} className="absolute inset-0 block">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {title.name.slice(0, 2)}
            </div>
          )}
        </Link>

        {/* Type badge — top left */}
        <span className={`pointer-events-none absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          title.type === "series"
            ? "bg-primary text-primary-foreground"
            : "bg-black/60 text-white/90 backdrop-blur-sm"
        }`}>
          {title.type === "series" ? "SERIE" : "PELÍCULA"}
        </span>

        {/* Bookmark — top right, over poster */}
        <div className="absolute right-2 top-2 z-10">
          <BookmarkDialog title={title} />
        </div>

        {/* Year badge — bottom left */}
        {title.year != null && (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
            {title.year}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-col gap-2 p-2.5">
        {/* Title */}
        <Link href={`/title/${title.id}`} className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {title.name}
          </p>
        </Link>

        {/* Ratings */}
        {(title.imdbRating != null || title.rottenTomatoesRating != null) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {title.imdbRating != null && <ImdbBadge rating={title.imdbRating} />}
            {title.rottenTomatoesRating != null && <RTBadge rating={title.rottenTomatoesRating} />}
          </div>
        )}

        {/* Platform icons — each links to that platform's page for this title */}
        {subSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {subSources.slice(0, 5).map((source, i) => {
              const def = getPlatformDef(source.providerName);
              const Wrapper = source.url
                ? ({ children }: { children: React.ReactNode }) => (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={def?.label ?? source.providerName}
                    >
                      {children}
                    </a>
                  )
                : ({ children }: { children: React.ReactNode }) => (
                    <span title={def?.label ?? source.providerName}>{children}</span>
                  );

              if (!def) return (
                <Wrapper key={i}>
                  <span className="rounded-md border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground">
                    {source.providerName}
                  </span>
                </Wrapper>
              );
              return (
                <Wrapper key={i}>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 hover:scale-115 hover:brightness-125"
                    style={{
                      backgroundColor: `${def.color}22`,
                      borderColor: `${def.color}55`,
                    }}
                  >
                    <def.Icon className="h-5 w-5" style={{ color: def.color }} />
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}

        {/* Ver ahora button */}
        {firstSource?.url && (() => {
          const def = getPlatformDef(firstSource.providerName);
          // Apple TV+ brand is white — use dark bg instead
          const isWhite = def?.color === "#FFFFFF";
          const btnColor = isWhite ? "#2a2a2e" : (def?.color ?? "var(--primary)");
          return (
            <a
              href={firstSource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group/play block"
            >
              <div
                className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold text-white transition-all duration-150 ease-out group-hover/play:-translate-y-px group-hover/play:brightness-115 active:scale-95 active:brightness-90"
                style={{
                  background: `linear-gradient(135deg, ${btnColor}ee 0%, ${btnColor}99 100%)`,
                  borderColor: `${btnColor}55`,
                  boxShadow: `0 2px 10px ${btnColor}45, inset 0 1px 0 rgba(255,255,255,0.12)`,
                }}
              >
                <Play className="h-3 w-3 shrink-0 fill-white" />
                <span>Ver ahora</span>
                {def && (
                  <def.Icon
                    className="ml-auto h-4 w-4 shrink-0"
                    style={{ color: isWhite ? "#fff" : def.color }}
                  />
                )}
              </div>
            </a>
          );
        })()}

        {/* Fallback: no info, just show genre/type hint */}
        {!hasInfo && !firstSource?.url && (
          <p className="text-[11px] text-muted-foreground">
            {title.type === "series" ? "Serie" : "Película"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
