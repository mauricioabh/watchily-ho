"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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

interface ListRow {
  id: string;
  name: string;
  is_public: boolean;
  created_at: string;
}

export function ListsView({ lists }: { lists: ListRow[] }) {
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
      if (res.ok) {
        setName("");
        setOpen(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva lista
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear lista</DialogTitle>
        </DialogHeader>
        <form onSubmit={createList} className="space-y-4">
          <div>
            <Label htmlFor="list-name">Nombre</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Por ver"
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()}>
            Crear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
