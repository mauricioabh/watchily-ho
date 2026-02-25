import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(request.url).origin + "/login-standalone", 302);

  const formData = await request.formData();
  const name = formData.get("name")?.toString()?.trim();
  const redirectTo = formData.get("redirect")?.toString() ?? new URL(request.url).origin + "/lists-standalone";

  if (!name) {
    return NextResponse.redirect(redirectTo + "?error=El+nombre+es+obligatorio", 302);
  }

  const { error } = await supabase.from("lists").insert({
    user_id: user.id,
    name,
    is_public: false,
  });

  if (error) {
    return NextResponse.redirect(redirectTo + "?error=" + encodeURIComponent(error.message), 302);
  }

  return NextResponse.redirect(redirectTo, 302);
}
