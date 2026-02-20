import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { title_id, title_type } = body as { title_id: string; title_type: "movie" | "series" };
  if (!title_id || !title_type) {
    return Response.json({ error: "Missing title_id or title_type" }, { status: 400 });
  }
  const { error } = await supabase
    .from("likes")
    .upsert(
      { user_id: user.id, title_id, title_type },
      { onConflict: "user_id,title_id" }
    );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const title_id = searchParams.get("title_id");
  if (!title_id) {
    return Response.json({ error: "Missing title_id" }, { status: 400 });
  }
  const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("title_id", title_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ likedIds: [] });
  }
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids"); // comma-separated title_ids
  if (!ids) {
    return Response.json({ likedIds: [] });
  }
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) return Response.json({ likedIds: [] });
  const { data } = await supabase
    .from("likes")
    .select("title_id")
    .eq("user_id", user.id)
    .in("title_id", idList);
  const likedIds = (data ?? []).map((r) => r.title_id);
  return Response.json({ likedIds });
}
