import { createAdminClient } from "@/lib/supabase/server";
import {
  getTitleDetails,
  isAvailabilityCacheFresh,
} from "@/lib/streaming/unified";

const DEFAULT_COUNTRY = "MX";

export async function refreshTitleAvailabilityCache(
  titleId: string,
  countryCode = DEFAULT_COUNTRY,
): Promise<{ titleId: string; ok: boolean; skipped?: boolean }> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("title_availability_cache")
    .select("refreshed_at")
    .eq("title_id", titleId)
    .eq("country_code", countryCode)
    .maybeSingle();

  if (existing && isAvailabilityCacheFresh(existing.refreshed_at)) {
    return { titleId, ok: true, skipped: true };
  }

  const detail = await getTitleDetails(titleId, {
    country: countryCode,
    region: countryCode,
  });
  if (!detail) {
    return { titleId, ok: false };
  }

  const { error } = await admin.from("title_availability_cache").upsert(
    {
      title_id: titleId,
      country_code: countryCode,
      payload: detail,
      refreshed_at: new Date().toISOString(),
    },
    { onConflict: "title_id,country_code" },
  );

  if (error) {
    console.error("[watchlist/refresh]", titleId, error.message);
    return { titleId, ok: false };
  }

  return { titleId, ok: true };
}
