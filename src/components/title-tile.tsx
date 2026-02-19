"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UnifiedTitle } from "@/types/streaming";
import { cn } from "@/lib/utils";

const API_BASE = "";

export function TitleTile({ title }: { title: UnifiedTitle }) {
  const [liked, setLiked] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [listIdsForTitle, setListIdsForTitle] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/likes?ids=${title.id}`)
      .then((r) => r.json())
      .then((d) => setLiked((d.likedIds ?? []).includes(title.id)))
      .catch(() => {});
  }, [title.id]);

  useEffect(() => {
    if (!bookmarkOpen) return;
    Promise.all([
      fetch(`${API_BASE}/api/lists`).then((r) => r.json()),
      fetch(`${API_BASE}/api/lists/items?title_id=${title.id}`).then((r) => r.json()),
    ]).then(([listRes, itemRes]) => {
      setLists(listRes.lists ?? []);
      setListIdsForTitle(itemRes.listIdsByTitle?.[title.id] ?? []);
    }).catch(() => {});
  }, [bookmarkOpen, title.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (liked) {
        await fetch(`${API_BASE}/api/likes?title_id=${title.id}`, { method: "DELETE" });
        setLiked(false);
      } else {
        await fetch(`${API_BASE}/api/likes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title_id: title.id, title_type: title.type }),
        });
        setLiked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToList = async (listId: string) => {
    await fetch(`${API_BASE}/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title_id: title.id, title_type: title.type }),
    });
    setListIdsForTitle((prev) => (prev.includes(listId) ? prev : [...prev, listId]));
  };

  const removeFromList = async (listId: string) => {
    await fetch(`${API_BASE}/api/lists/${listId}/items?title_id=${title.id}`, {
      method: "DELETE",
    });
    setListIdsForTitle((prev) => prev.filter((id) => id !== listId));
  };

  const createListAndAdd = async () => {
    if (!newListName.trim()) return;
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
  };

  const posterUrl = title.poster?.startsWith("http") ? title.poster : undefined;

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted">
      <Link href={`/title/${title.id}`} className="block h-full w-full">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            {title.name.slice(0, 2)}
          </div>
        )}
        {title.type === "series" && (
          <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
            TV
          </span>
        )}
        {/* Hover overlay: ratings */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-primary/90 px-2 py-1.5 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {title.imdbRating != null && (
            <span>IMDb {title.imdbRating.toFixed(1)}</span>
          )}
          {title.rottenTomatoesRating != null && (
            <span>{title.rottenTomatoesRating}%</span>
          )}
          {title.imdbRating == null && title.rottenTomatoesRating == null && (
            <span>—</span>
          )}
        </div>
      </Link>
      {/* Actions */}
      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={toggleLike}
          disabled={loading}
        >
          <Heart
            className={cn("h-4 w-4", liked && "fill-red-500 text-red-500")}
          />
        </Button>
        <Dialog open={bookmarkOpen} onOpenChange={setBookmarkOpen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir a lista</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{title.name}</p>
            <div className="space-y-2">
              {lists.map((list) => {
                const inList = listIdsForTitle.includes(list.id);
                return (
                  <div
                    key={list.id}
                    className="flex items-center justify-between rounded border border-border px-3 py-2"
                  >
                    <span>{list.name}</span>
                    <Button
                      variant={inList ? "destructive" : "default"}
                      size="sm"
                      onClick={() =>
                        inList ? removeFromList(list.id) : addToList(list.id)
                      }
                    >
                      {inList ? "Quitar" : "Añadir"}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nueva lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Button onClick={createListAndAdd} disabled={!newListName.trim()}>
                Crear y añadir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
