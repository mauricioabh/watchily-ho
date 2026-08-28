"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizedPath } from "@/i18n/routing";
import { Pencil, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  getMutationErrorMessage,
  requireSuccessfulResponse,
} from "@/lib/mutation-feedback";

export function ListActions({
  listId,
  listName,
}: {
  listId: string;
  listName: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(listName);
  const [loading, setLoading] = useState(false);

  const updateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await requireSuccessfulResponse(res, t("renameListError"));
      setEditOpen(false);
      toast.success(t("rename"));
      router.refresh();
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("renameListError")));
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async () => {
    if (!confirm(t("deleteListConfirm"))) {
      return;
    }
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      await requireSuccessfulResponse(res, t("deleteListError"));
      toast.success(t("delete"));
      router.push(localizedPath("/library", locale));
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("deleteListError")));
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1 h-4 w-4" />
            {t("edit")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateList} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t("newList")}</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              {t("save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button variant="destructive" size="sm" onClick={deleteList}>
        <Trash2 className="mr-1 h-4 w-4" />
        {t("delete")}
      </Button>
    </div>
  );
}
