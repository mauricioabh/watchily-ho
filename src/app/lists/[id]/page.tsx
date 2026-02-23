import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { TitleTile } from "@/components/title-tile";
import { ListActions } from "@/components/list-actions";
import type { UnifiedTitle } from "@/types/streaming";
import { Button } from "@/components/ui/button";

export default async function ListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerRows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);

  const { data: list } = await supabase
    .from("lists")
    .select("id, name, is_public")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!list) notFound();

  const { data: items } = await supabase
    .from("list_items")
    .select("title_id, title_type")
    .eq("list_id", id)
    .order("added_at", { ascending: false });

  const { type: filterType, sort } = await searchParams;
  let filtered = items ?? [];
  if (filterType === "movie") filtered = filtered.filter((i) => i.title_type === "movie");
  if (filterType === "series") filtered = filtered.filter((i) => i.title_type === "series");

  const rawTitles: UnifiedTitle[] = [];
  for (const item of filtered) {
    const t = await getTitleDetails(item.title_id);
    if (t) rawTitles.push(t);
  }
  // Trim sources to only the user's subscribed providers
  const titles = filterTitlesByUserProviders(rawTitles, userProviderIds);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/lists" className="text-sm text-muted-foreground hover:text-foreground">
          ← Mis listas
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{list.name}</h1>
          <p className="text-muted-foreground">{titles.length} títulos</p>
        </div>
        <ListActions listId={list.id} listName={list.name} />
      </div>
      <div className="mb-4 flex gap-2">
        <Link href={`/lists/${id}`}>
          <Button variant={!filterType ? "default" : "outline"} size="sm">
            Ver todo
          </Button>
        </Link>
        <Link href={`/lists/${id}?type=movie`}>
          <Button variant={filterType === "movie" ? "default" : "outline"} size="sm">
            Películas
          </Button>
        </Link>
        <Link href={`/lists/${id}?type=series`}>
          <Button variant={filterType === "series" ? "default" : "outline"} size="sm">
            Series
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {titles.map((title) => (
          <TitleTile key={title.id} title={title} />
        ))}
      </div>
    </main>
  );
}
