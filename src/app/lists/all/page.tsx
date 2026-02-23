import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { AllTitlesContent } from "@/components/all-titles-content";
import type { UnifiedTitle } from "@/types/streaming";

export type ListSection = { id: string; name: string; titles: UnifiedTitle[] };

async function AllTitlesData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerRows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!lists?.length) {
    return <AllTitlesContent sections={[]} />;
  }

  const listIds = lists.map((l) => l.id);

  const { data: items } = await supabase
    .from("list_items")
    .select("list_id, title_id, title_type")
    .in("list_id", listIds)
    .order("added_at", { ascending: false });

  // Group title_ids by list
  const byList: Record<string, string[]> = {};
  for (const item of items ?? []) {
    if (!byList[item.list_id]) byList[item.list_id] = [];
    byList[item.list_id].push(item.title_id);
  }

  // Fetch all unique title details once, then reuse per section
  const allUniqueIds = [...new Set((items ?? []).map((i) => i.title_id))];
  const BATCH = 8;
  const detailsMap = new Map<string, UnifiedTitle>();
  for (let i = 0; i < allUniqueIds.length; i += BATCH) {
    const batch = allUniqueIds.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map((id) => getTitleDetails(id)));
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value) detailsMap.set(batch[j], r.value);
    }
  }

  // Build sections preserving list order, trim sources to user's providers, skip empty lists
  const sections: ListSection[] = lists
    .map((list) => {
      const raw = (byList[list.id] ?? [])
        .map((id) => detailsMap.get(id))
        .filter(Boolean) as UnifiedTitle[];
      const titles = filterTitlesByUserProviders(raw, userProviderIds);
      return { id: list.id, name: list.name, titles };
    })
    .filter((s) => s.titles.length > 0);

  return <AllTitlesContent sections={sections} />;
}

export default async function AllTitlesPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/lists"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mis listas
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-10">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-white/5" />
            {[1, 2].map((s) => (
              <div key={s} className="space-y-4">
                <div className="h-6 w-40 animate-pulse rounded bg-white/5" />
                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-xl bg-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <AllTitlesData />
      </Suspense>
    </main>
  );
}
