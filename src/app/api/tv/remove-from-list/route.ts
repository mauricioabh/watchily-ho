import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(request.url).origin + "/login-standalone", 302);

  const formData = await request.formData();
  const listId = formData.get("list_id")?.toString();
  const titleId = formData.get("title_id")?.toString();
  const redirectTo = formData.get("redirect")?.toString();

  if (!listId || !titleId) {
    return NextResponse.redirect(redirectTo ?? new URL(request.url).origin + "/tv-standalone", 302);
  }

  const { data: list } = await supabase.from("lists").select("id").eq("id", listId).eq("user_id", user.id).single();
  if (!list) return NextResponse.redirect(redirectTo ?? new URL(request.url).origin + "/tv-standalone", 302);

  await supabase.from("list_items").delete().eq("list_id", listId).eq("title_id", titleId);

  return NextResponse.redirect(redirectTo ?? new URL(request.url).origin + "/tv-standalone", 302);
}
