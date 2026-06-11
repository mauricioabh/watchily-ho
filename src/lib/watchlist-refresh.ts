import { createAdminClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";

const DEFAULT_COUNTRY = "MX";

export async function refreshTitleAvailabilityCache(
  titleId: string,
  countryCode = DEFAULT_COUNTRY,
): Promise<{ titleId: string; ok: boolean }> {
  const detail = await getTitleDetails(titleId, {
    country: countryCode,
    region: countryCode,
  });
  if (!detail) {
    return { titleId, ok: false };
  }

  const admin = createAdminClient();
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
