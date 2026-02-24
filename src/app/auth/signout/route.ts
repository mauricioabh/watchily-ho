import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  const origin = url.origin;
  try {
    const formData = await request.formData();
    const redirectTo = formData.get("redirect")?.toString();
    if (redirectTo && redirectTo.startsWith("/")) {
      return NextResponse.redirect(`${origin}${redirectTo}`, 302);
    }
  } catch {
    // ignore
  }
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
