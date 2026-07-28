"use client";

import { useState, useEffect } from "react";
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
import { WatchStatusControls } from "@/components/watch-status-controls";
import { cn } from "@/lib/utils";
import type { WatchStatus } from "@/types/library";

export function TitleActions({
  titleId,
  titleType,
  titleName,
}: {
  titleId: string;
  titleType: "movie" | "series";
  titleName: string;
}) {
  const [liked, setLiked] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [listIdsForTitle, setListIdsForTitle] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    fetch(`/api/likes?ids=${titleId}`)
      .then((r) => r.json())
      .then((d) => setLiked((d.likedIds ?? []).includes(titleId)))
      .catch(() => {});
  }, [titleId]);

  useEffect(() => {
    fetch(`/api/watch-status?ids=${titleId}`)
      .then((r) => r.json())
      .then((d) => setWatchStatus(d.statuses?.[titleId] ?? null))
      .catch(() => {});
  }, [titleId]);

  useEffect(() => {
    if (!bookmarkOpen) return;
    Promise.all([
      fetch("/api/lists").then((r) => r.json()),
      fetch(`/api/lists/items?title_id=${titleId}`).then((r) => r.json()),
    ])
      .then(([listRes, itemRes]) => {
        setLists(listRes.lists ?? []);
        setListIdsForTitle(itemRes.listIdsByTitle?.[titleId] ?? []);
      })
      .catch(() => {});
  }, [bookmarkOpen, titleId]);

  const toggleLike = async () => {
    if (liked) {
      await fetch(`/api/likes?title_id=${titleId}`, { method: "DELETE" });
      setLiked(false);
    } else {
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_id: titleId, title_type: titleType }),
      });
      setLiked(true);
    }
  };

  const addToList = async (listId: string) => {
    await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title_id: titleId, title_type: titleType }),
    });
    setListIdsForTitle((prev) =>
      prev.includes(listId) ? prev : [...prev, listId],
    );
  };

  const removeFromList = async (listId: string) => {
    await fetch(`/api/lists/${listId}/items?title_id=${titleId}`, {
      method: "DELETE",
    });
    setListIdsForTitle((prev) => prev.filter((id) => id !== listId));
  };

  const createListAndAdd = async () => {
    if (!newListName.trim()) return;
    const res = await fetch("/api/lists", {
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <WatchStatusControls
        titleId={titleId}
        status={watchStatus}
        onChange={(_id, status) => setWatchStatus(status)}
      />
      <Button variant="outline" size="sm" onClick={toggleLike}>
        <Heart
          className={cn("mr-1 h-4 w-4", liked && "fill-red-500 text-red-500")}
        />
        {liked ? "Unlike" : "Like"}
      </Button>
      <Dialog open={bookmarkOpen} onOpenChange={setBookmarkOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="mr-1 h-4 w-4" />
            Lists
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to list</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{titleName}</p>
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
                    {inList ? "Remove" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New list"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <Button onClick={createListAndAdd} disabled={!newListName.trim()}>
              Create & add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
