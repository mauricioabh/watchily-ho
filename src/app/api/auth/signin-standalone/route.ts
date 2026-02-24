import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirect")?.toString() ?? "/tv?device=tv";

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login-standalone?error=missing`, request.url),
      302
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login-standalone?error=${encodeURIComponent(error.message)}`, 302);
  }

  const base = new URL(request.url).origin;
  const target = redirectTo.startsWith("http") ? redirectTo : `${base}${redirectTo}`;
  return NextResponse.redirect(target, 302);
}
