import { NextRequest } from "next/server";
import { getSupabaseAndUser } from "@/lib/supabase/server";

export async function GET() {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ lists: [] });
  }
  let { data, error } = await supabase
    .from("lists")
    .select("id, name, is_public, created_at, list_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  // Fallback if list_items(count) relation not available
  if (error) {
    const fallback = await supabase
      .from("lists")
      .select("id, name, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    data = fallback.data ?? [];
    error = fallback.error;
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });
  // Normalize: list_items comes as [{ count: N }] from PostgREST when available
  const lists = (data ?? []).map((l: { list_items?: { count: number }[] }) => {
    const { list_items, ...rest } = l as { list_items?: { count: number }[] };
    const count = Array.isArray(list_items) && list_items[0] ? list_items[0].count : 0;
    return { ...rest, item_count: count };
  });
  return Response.json({ lists });
}

export async function POST(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { name, is_public } = body as { name: string; is_public?: boolean };
  if (!name?.trim()) {
    return Response.json({ error: "Missing name" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: user.id, name: name.trim(), is_public: !!is_public })
    .select("id, name, is_public")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
