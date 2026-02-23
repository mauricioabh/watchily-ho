import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListsView } from "@/components/lists-view";
import { ListCard } from "@/components/list-card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";

const LIST_ACCENTS = [
  { border: "rgba(99,102,241,0.5)",  fill: "rgba(99,102,241,0.07)",  fillHover: "rgba(99,102,241,0.16)",  glow: "rgba(99,102,241,0.22)",  badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { border: "rgba(14,165,233,0.5)",  fill: "rgba(14,165,233,0.07)",  fillHover: "rgba(14,165,233,0.16)",  glow: "rgba(14,165,233,0.22)",  badge: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  { border: "rgba(244,63,94,0.5)",   fill: "rgba(244,63,94,0.07)",   fillHover: "rgba(244,63,94,0.16)",   glow: "rgba(244,63,94,0.22)",   badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { border: "rgba(16,185,129,0.5)",  fill: "rgba(16,185,129,0.07)",  fillHover: "rgba(16,185,129,0.16)",  glow: "rgba(16,185,129,0.22)",  badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { border: "rgba(245,158,11,0.5)",  fill: "rgba(245,158,11,0.07)",  fillHover: "rgba(245,158,11,0.16)",  glow: "rgba(245,158,11,0.22)",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { border: "rgba(139,92,246,0.5)",  fill: "rgba(139,92,246,0.07)",  fillHover: "rgba(139,92,246,0.16)",  glow: "rgba(139,92,246,0.22)",  badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { border: "rgba(236,72,153,0.5)",  fill: "rgba(236,72,153,0.07)",  fillHover: "rgba(236,72,153,0.16)",  glow: "rgba(236,72,153,0.22)",  badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { border: "rgba(234,179,8,0.5)",   fill: "rgba(234,179,8,0.07)",   fillHover: "rgba(234,179,8,0.16)",   glow: "rgba(234,179,8,0.22)",   badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
] as const;

export default async function ListsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name, is_public, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Count items per list
  const listIds = (lists ?? []).map((l) => l.id);
  const { data: itemRows } = listIds.length
    ? await supabase.from("list_items").select("list_id").in("list_id", listIds)
    : { data: [] };

  const countByList: Record<string, number> = {};
  for (const row of itemRows ?? []) {
    countByList[row.list_id] = (countByList[row.list_id] ?? 0) + 1;
  }
  const totalTitles = Object.values(countByList).reduce((a, b) => a + b, 0);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold">Mis listas</h1>
          {(lists ?? []).length > 0 && (
            <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-0.5 text-sm font-semibold text-foreground/60">
              {(lists ?? []).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(lists ?? []).length > 0 && (
            <Link href="/lists/all">
              <Button variant="accent" size="sm" className="h-9 gap-2">
                <Layers className="h-3.5 w-3.5" />
                Ver todo
                {totalTitles > 0 && (
                  <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                    {totalTitles}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <ListsView lists={lists ?? []} />
        </div>
      </div>

      {(lists ?? []).length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-card/30 py-16 text-center">
          <p className="text-muted-foreground">Aún no tienes listas. ¡Crea una!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(lists ?? []).map((list, i) => (
            <ListCard
              key={list.id}
              id={list.id}
              name={list.name}
              isPublic={list.is_public}
              count={countByList[list.id] ?? 0}
              accent={LIST_ACCENTS[i % LIST_ACCENTS.length]}
            />
          ))}
        </div>
      )}
    </main>
  );
}
