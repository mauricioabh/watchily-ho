import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/popular";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [{ data: profile }, { data: providerRows }] = await Promise.all([
          supabase.from("profiles").select("country_code").eq("id", user.id).single(),
          supabase.from("user_providers").select("provider_id").eq("user_id", user.id),
        ]);

        const needsOnboarding =
          !profile?.country_code || (providerRows ?? []).length === 0;

        if (needsOnboarding) {
          return NextResponse.redirect(`${origin}/settings?onboarding=1`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
