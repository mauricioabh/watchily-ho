import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ needsOnboarding: true }, { status: 401 });
  }

  const [{ data: profile }, { data: providerRows }] = await Promise.all([
    supabase.from("profiles").select("country_code").eq("id", user.id).single(),
    supabase.from("user_providers").select("provider_id").eq("user_id", user.id),
  ]);

  const hasCountry = Boolean(profile?.country_code);
  const hasProviders = (providerRows ?? []).length > 0;

  return Response.json({
    needsOnboarding: !hasCountry || !hasProviders,
  });
}

