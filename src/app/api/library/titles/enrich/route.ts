import { z } from "zod";
import { getSupabaseAndUser, createAdminClient } from "@/lib/supabase/server";
import {
  getTitleDetails,
  isLibraryTitleHydrated,
} from "@/lib/streaming/unified";
import type { UnifiedTitle } from "@/types/streaming";

const BodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(24),
  country: z.string().min(2).max(2).optional(),
});

const DEFAULT_COUNTRY = "MX";

type CacheRow = {
  title_id: string;
  payload: unknown;
  refreshed_at?: string | null;
};

function isUnifiedTitle(value: unknown): value is UnifiedTitle {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.type === "movie" || v.type === "series")
  );
}

export async function POST(request: Request) {
  const { user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const country = (parsed.data.country ?? DEFAULT_COUNTRY).toUpperCase();
  const ids = [...new Set(parsed.data.ids)];

  const admin = createAdminClient();
  const { data: cachedRaw, error: cacheError } = await admin
    .from("title_availability_cache")
    .select("title_id, payload, refreshed_at")
    .eq("country_code", country)
    .in("title_id", ids);

  if (cacheError) {
    return Response.json({ error: cacheError.message }, { status: 500 });
  }

  const cached = (cachedRaw ?? []) as CacheRow[];
  const byId = new Map<string, UnifiedTitle>();

  for (const row of cached) {
    if (isUnifiedTitle(row.payload) && isLibraryTitleHydrated(row.payload)) {
      byId.set(row.title_id, row.payload);
    }
  }

  const missing = ids.filter((id) => !byId.has(id));

  // Sequential fetches — avoids serverless timeouts from parallel Watchmode+SA calls.
  for (const id of missing) {
    try {
      const detail = await getTitleDetails(id, {
        country,
        region: country,
      });
      if (!detail || !isLibraryTitleHydrated(detail)) continue;
      byId.set(id, detail);
      await admin.from("title_availability_cache").upsert(
        {
          title_id: id,
          country_code: country,
          payload: detail,
          refreshed_at: new Date().toISOString(),
        },
        { onConflict: "title_id,country_code" },
      );
    } catch (err) {
      console.error("[library/enrich]", id, err);
    }
  }

  const titles = ids
    .map((id) => byId.get(id))
    .filter((t): t is UnifiedTitle => Boolean(t));

  return Response.json({ titles });
}
