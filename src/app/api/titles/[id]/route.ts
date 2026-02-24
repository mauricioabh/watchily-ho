import { NextRequest } from "next/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? searchParams.get("country") ?? "US";

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    let title = await getTitleDetails(id, { region, country: region });
    if (!title) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // When user is authenticated, trim sources to only their subscribed providers
    const { client: supabase, user } = await getSupabaseAndUser();
    if (user) {
      const { data: providerRows } = await supabase
        .from("user_providers")
        .select("provider_id")
        .eq("user_id", user.id);
      const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
      const filtered = filterTitlesByUserProviders([title], userProviderIds);
      title = filtered[0] ?? { ...title, sources: [] };
    }

    return Response.json(title);
  } catch (e) {
    console.error("Title details error:", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
