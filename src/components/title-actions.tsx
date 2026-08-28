"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark } from "lucide-react";
import { toast } from "sonner";
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
import { captureProductEvent } from "@/lib/analytics";
import {
  getMutationErrorMessage,
  requireSuccessfulResponse,
} from "@/lib/mutation-feedback";
import { useAuthScope } from "@/components/app-providers";
import {
  queryKeys,
  type LikesResponse,
  type ListResponse,
  type MembershipResponse,
  type WatchStatusResponse,
} from "@/lib/query";
export function TitleActions({
  titleId,
  titleType,
  titleName,
  userId,
}: {
  titleId: string;
  titleType: "movie" | "series";
  titleName: string;
  userId?: string | null;
}) {
  const t = useTranslations("common");
  const queryClient = useQueryClient();
  const authScope = useAuthScope();
  const scope = authScope === undefined ? (userId ?? null) : authScope;
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const likedQuery = useQuery({
    queryKey: queryKeys.likes(titleId, scope),
    queryFn: async (): Promise<LikesResponse> =>
      (await fetch(`/api/likes?ids=${encodeURIComponent(titleId)}`)).json(),
    enabled: scope !== undefined,
  });
  const watchQuery = useQuery({
    queryKey: queryKeys.watchStatus(titleId, scope),
    queryFn: async (): Promise<WatchStatusResponse> =>
      (
        await fetch(`/api/watch-status?ids=${encodeURIComponent(titleId)}`)
      ).json(),
    enabled: scope !== undefined,
  });
  const listsQuery = useQuery({
    queryKey: queryKeys.lists(scope),
    queryFn: async (): Promise<{ lists: ListResponse[] }> =>
      (await fetch("/api/lists")).json(),
    enabled: bookmarkOpen && scope !== undefined,
  });
  const membershipQuery = useQuery({
    queryKey: queryKeys.membership(titleId, scope),
    queryFn: async (): Promise<MembershipResponse> =>
      (
        await fetch(`/api/lists/items?title_id=${encodeURIComponent(titleId)}`)
      ).json(),
    enabled: scope !== undefined,
  });

  const likeMutation = useMutation({
    mutationKey: ["like-title", titleId, scope],
    mutationFn: async (currentlyLiked: boolean) => {
      const response = currentlyLiked
        ? await fetch(`/api/likes?title_id=${encodeURIComponent(titleId)}`, {
            method: "DELETE",
          })
        : await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title_id: titleId, title_type: titleType }),
          });
      await requireSuccessfulResponse(response, t("updateLikeError"));
    },
    onSuccess: (_data, currentlyLiked) => {
      queryClient.setQueryData<LikesResponse>(queryKeys.likes(titleId, scope), {
        likedIds: currentlyLiked ? [] : [titleId],
      });
      void queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
  });

  const membershipMutation = useMutation({
    mutationKey: ["list-membership", titleId, scope],
    mutationFn: async ({
      listId,
      action,
    }: {
      listId: string;
      action: "add" | "remove";
    }) => {
      const response = await fetch(
        `/api/lists/${listId}/items?title_id=${encodeURIComponent(titleId)}`,
        action === "add"
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title_id: titleId,
                title_type: titleType,
              }),
            }
          : { method: "DELETE" },
      );
      await requireSuccessfulResponse(
        response,
        action === "add" ? t("addListError") : t("removeListError"),
      );
      return action;
    },
    onSuccess: (_action, variables) => {
      queryClient.setQueryData<MembershipResponse>(
        queryKeys.membership(titleId, scope),
        (previous) => {
          const current = previous?.listIdsByTitle[titleId] ?? [];
          const next =
            variables.action === "add"
              ? [...new Set([...current, variables.listId])]
              : current.filter((id) => id !== variables.listId);
          return { listIdsByTitle: { [titleId]: next } };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["lists"] });
      void queryClient.invalidateQueries({ queryKey: ["list-membership"] });
    },
  });

  const createListMutation = useMutation({
    mutationKey: ["create-list", scope],
    mutationFn: async () => {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim(), is_public: false }),
      });
      await requireSuccessfulResponse(response, t("createListError"));
      return (await response.json()) as ListResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists(scope) });
    },
  });

  const liked = likedQuery.data?.likedIds.includes(titleId) ?? false;
  const watchStatus = watchQuery.data?.statuses[titleId] ?? null;
  const lists = listsQuery.data?.lists ?? [];
  const listIdsForTitle = membershipQuery.data?.listIdsByTitle[titleId] ?? [];

  const toggleLike = async () => {
    try {
      await likeMutation.mutateAsync(liked);
      toast.success(liked ? t("unlike") : t("like"));
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("updateLikeError")));
    }
  };

  const changeMembership = async (listId: string, action: "add" | "remove") => {
    try {
      await membershipMutation.mutateAsync({ listId, action });
      captureProductEvent("list_membership_changed", { action, titleType });
      toast.success(action === "add" ? t("add") : t("remove"));
    } catch (error) {
      toast.error(
        getMutationErrorMessage(
          error,
          action === "add" ? t("addListError") : t("removeListError"),
        ),
      );
    }
  };

  const createListAndAdd = async () => {
    if (!newListName.trim()) return;
    try {
      const created = await createListMutation.mutateAsync();
      await changeMembership(created.id, "add");
      setNewListName("");
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("createListError")));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <WatchStatusControls
        titleId={titleId}
        status={watchStatus}
        onChange={(_id, status) => {
          queryClient.setQueryData<WatchStatusResponse>(
            queryKeys.watchStatus(titleId, scope),
            { statuses: status ? { [titleId]: status } : {} },
          );
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLike}
        disabled={likeMutation.isPending}
      >
        <Heart
          className={cn("mr-1 h-4 w-4", liked && "fill-red-500 text-red-500")}
        />
        {liked ? t("remove") : t("add")}
      </Button>
      <Dialog open={bookmarkOpen} onOpenChange={setBookmarkOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="mr-1 h-4 w-4" />
            {t("lists")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add")}</DialogTitle>
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
                    disabled={membershipMutation.isPending}
                    onClick={() =>
                      void changeMembership(list.id, inList ? "remove" : "add")
                    }
                  >
                    {inList ? t("remove") : t("add")}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("newList")}
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
            />
            <Button
              onClick={() => void createListAndAdd()}
              disabled={!newListName.trim() || createListMutation.isPending}
            >
              {t("create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
