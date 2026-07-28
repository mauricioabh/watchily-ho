import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { ListTitlesContent } from "@/components/list-titles-content";
import type { StatusMap } from "@/types/library";
import type { UnifiedTitle } from "@/types/streaming";

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

  const { data: statusRows } = await supabase
    .from("user_title_statuses")
    .select("title_id, status")
    .eq("user_id", user.id);

  const statusMap: StatusMap = {};
  for (const row of statusRows ?? []) {
    if (row.status === "watching" || row.status === "finished") {
      statusMap[row.title_id] = row.status;
    }
  }

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
    .order("position", { ascending: true });

  const { type: filterType } = await searchParams;
  let filtered = items ?? [];
  if (filterType === "movie")
    filtered = filtered.filter((i) => i.title_type === "movie");
  if (filterType === "series")
    filtered = filtered.filter((i) => i.title_type === "series");

  const rawTitles: UnifiedTitle[] = [];
  for (const item of filtered) {
    const t = await getTitleDetails(item.title_id);
    if (t) rawTitles.push(t);
  }
  // Keep all subscribed sources; client filter narrows to active chips
  const titles = filterTitlesByUserProviders(rawTitles, userProviderIds);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/library"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Library
        </Link>
      </div>
      <ListTitlesContent
        listId={list.id}
        listName={list.name}
        titles={titles}
        userProviderIds={userProviderIds}
        statusMap={statusMap}
        filterType={filterType}
      />
    </main>
  );
}
