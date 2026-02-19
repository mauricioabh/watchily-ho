"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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

export function ListActions({
  listId,
  listName,
}: {
  listId: string;
  listName: string;
}) {
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
      if (res.ok) {
        setEditOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async () => {
    if (!confirm("¿Eliminar esta lista? No se eliminan los títulos, solo la lista.")) return;
    const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    if (res.ok) router.push("/lists");
  };

  return (
    <div className="flex gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1 h-4 w-4" />
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lista</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateList} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button variant="destructive" size="sm" onClick={deleteList}>
        <Trash2 className="mr-1 h-4 w-4" />
        Eliminar
      </Button>
    </div>
  );
}
