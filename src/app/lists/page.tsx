import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListsView } from "@/components/lists-view";
import { Button } from "@/components/ui/button";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name, is_public, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="container px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis listas</h1>
        <ListsView lists={lists ?? []} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(lists ?? []).map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <h2 className="font-semibold">{list.name}</h2>
            <p className="text-sm text-muted-foreground">
              {list.is_public ? "Pública" : "Privada"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
