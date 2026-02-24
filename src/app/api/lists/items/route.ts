import { NextRequest } from "next/server";
import { getSupabaseAndUser } from "@/lib/supabase/server";

// GET: which lists contain the given title_ids (for current user)
export async function GET(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ listIdsByTitle: {} });
  }
  const { searchParams } = new URL(request.url);
  const titleId = searchParams.get("title_id");
  if (!titleId) {
    return Response.json({ listIdsByTitle: {} });
  }
  const { data: items } = await supabase
    .from("list_items")
    .select("list_id")
    .eq("title_id", titleId);
  const listIds = (items ?? []).map((r) => r.list_id);
  const { data: lists } = await supabase
    .from("lists")
    .select("id")
    .eq("user_id", user.id)
    .in("id", listIds);
  const ownListIds = (lists ?? []).map((r) => r.id);
  return Response.json({
    listIdsByTitle: { [titleId]: ownListIds },
  });
}
