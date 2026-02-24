import { NextRequest } from "next/server";
import { getSupabaseAndUser } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ items: [] });
  }
  const { data: list } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();
  if (!list) return Response.json({ items: [] }, { status: 404 });
  const { data: items, error } = await supabase
    .from("list_items")
    .select("id, title_id, title_type, added_at")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: items ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { title_id, title_type } = body as { title_id: string; title_type: "movie" | "series" };
  if (!title_id || !title_type) {
    return Response.json({ error: "Missing title_id or title_type" }, { status: 400 });
  }
  const { error } = await supabase.from("list_items").insert({
    list_id: listId,
    title_id,
    title_type,
  });
  if (error) {
    if (error.code === "23505") return Response.json({ ok: true });
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const title_id = searchParams.get("title_id");
  if (!title_id) {
    return Response.json({ error: "Missing title_id" }, { status: 400 });
  }
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("title_id", title_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}