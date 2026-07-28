import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { LibraryContent } from "@/components/library-content";
import type { LibraryPrefs, ListSection, StatusMap } from "@/types/library";
import type { UnifiedTitle } from "@/types/streaming";

export type { ListSection } from "@/types/library";

function normalizePrefs(
  row: {
    library_status_filter: string | null;
    library_title_sort: string | null;
  } | null,
): LibraryPrefs {
  const statusFilter =
    row?.library_status_filter === "watching" ||
    row?.library_status_filter === "finished"
      ? row.library_status_filter
      : "all";
  const titleSort =
    row?.library_title_sort === "asc" || row?.library_title_sort === "desc"
      ? row.library_title_sort
      : "custom";
  return { statusFilter, titleSort };
}

async function LibraryData() {
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

  const { data: prefsRow } = await supabase
    .from("profiles")
    .select("library_status_filter, library_title_sort")
    .eq("id", user.id)
    .single();
  const prefs = normalizePrefs(prefsRow);

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (!lists?.length) {
    return (
      <LibraryContent
        sections={[]}
        userProviderIds={userProviderIds}
        statusMap={statusMap}
        prefs={prefs}
      />
    );
  }

  const listIds = lists.map((l) => l.id);

  const { data: items } = await supabase
    .from("list_items")
    .select("list_id, title_id, title_type, position")
    .in("list_id", listIds)
    .order("position", { ascending: true });

  const byList: Record<string, { title_id: string; position: number }[]> = {};
  for (const item of items ?? []) {
    if (!byList[item.list_id]) byList[item.list_id] = [];
    byList[item.list_id].push({
      title_id: item.title_id,
      position: item.position,
    });
  }
  for (const listId of Object.keys(byList)) {
    byList[listId].sort((a, b) => a.position - b.position);
  }

  const allUniqueIds = [...new Set((items ?? []).map((i) => i.title_id))];
  const BATCH = 8;
  const detailsMap = new Map<string, UnifiedTitle>();
  for (let i = 0; i < allUniqueIds.length; i += BATCH) {
    const batch = allUniqueIds.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((id) => getTitleDetails(id)),
    );
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value)
        detailsMap.set(batch[j], r.value);
    }
  }

  const sections: ListSection[] = lists.map((list) => {
    const raw = (byList[list.id] ?? [])
      .map((row) => detailsMap.get(row.title_id))
      .filter(Boolean) as UnifiedTitle[];
    const titles = filterTitlesByUserProviders(raw, userProviderIds);
    return { id: list.id, name: list.name, titles };
  });

  return (
    <LibraryContent
      sections={sections}
      userProviderIds={userProviderIds}
      statusMap={statusMap}
      prefs={prefs}
    />
  );
}

export default async function LibraryPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <div className="space-y-10">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-white/5" />
            {[1, 2].map((s) => (
              <div key={s} className="space-y-4">
                <div className="h-6 w-40 animate-pulse rounded bg-white/5" />
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-72 animate-pulse rounded-xl bg-white/5"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <LibraryData />
      </Suspense>
    </main>
  );
}
