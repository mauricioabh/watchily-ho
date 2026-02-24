import { NextRequest } from "next/server";
import { getSupabaseAndUser } from "@/lib/supabase/server";

const KNOWN_PROVIDERS = [
  { id: "netflix", name: "Netflix" },
  { id: "disney_plus", name: "Disney+" },
  { id: "hbo_max", name: "HBO Max" },
  { id: "amazon_prime", name: "Amazon Prime Video" },
  { id: "apple_tv_plus", name: "Apple TV+" },
  { id: "paramount_plus", name: "Paramount+" },
  { id: "crunchyroll", name: "Crunchyroll" },
];

export async function GET() {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) return Response.json({ providers: [], selectedIds: [] });
  const { data: rows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const selectedIds = (rows ?? []).map((r) => r.provider_id);
  return Response.json({ providers: KNOWN_PROVIDERS, selectedIds });
}

export async function PUT(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { providerIds } = body as { providerIds: string[] };
  if (!Array.isArray(providerIds)) {
    return Response.json({ error: "providerIds must be an array" }, { status: 400 });
  }
  await supabase.from("user_providers").delete().eq("user_id", user.id);
  if (providerIds.length > 0) {
    const validIds = providerIds.filter((id: unknown) => typeof id === "string");
    await supabase.from("user_providers").insert(
      validIds.map((provider_id: string) => ({ user_id: user.id, provider_id }))
    );
  }
  return Response.json({ ok: true });
}
