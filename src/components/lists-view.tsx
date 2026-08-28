"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
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

interface ListRow {
  id: string;
  name: string;
  is_public: boolean;
  created_at: string;
}

export function ListsView({ lists }: { lists: ListRow[] }) {
  void lists;
  const t = useTranslations("lists");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), is_public: false }),
      });
      await requireSuccessfulResponse(res, t("createListError"));
      setName("");
      setOpen(false);
      toast.success(t("createTitle"));
      window.location.reload();
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("createListError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 gap-2 bg-blue-800 text-white hover:bg-blue-900 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newListPlaceholder")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={createList} className="space-y-4">
          <div>
            <Label htmlFor="list-name">{t("name")}</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()}>
            {t("createTitle")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
