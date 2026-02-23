import { NextRequest } from "next/server";
import { getPopularTitles } from "@/lib/streaming/unified";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { createClientForRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const country = searchParams.get("country") ?? "MX";

  try {
    const supabase = await createClientForRequest();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: providerRows } = user
      ? await supabase.from("user_providers").select("provider_id").eq("user_id", user.id)
      : { data: [] };

    const userProviderIds = (providerRows ?? []).map((r: { provider_id: string }) => r.provider_id);
    const sourceIds = userProviderIds
      .map((id: string) => PROVIDER_TO_SOURCE_ID[id])
      .filter(Boolean) as number[];

    const raw = await getPopularTitles({
      type: type === "series" ? "series" : "movie",
      country,
      enrich: true,
      sourceIds,
    });

    // Trim each title's sources to only the user's subscribed providers
    const titles = filterTitlesByUserProviders(raw, userProviderIds);

    return Response.json({ titles });
  } catch (e) {
    console.error("Popular titles error:", e);
    return Response.json({ titles: [] }, { status: 500 });
  }
}
