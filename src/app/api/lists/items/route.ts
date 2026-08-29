import { NextRequest } from "next/server";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import { parseTitleIdsParam } from "@/lib/interaction-state";

// GET: which lists contain the given title_ids (for current user)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawIds = searchParams.get("title_ids") ?? searchParams.get("title_id");
  const parsedIds = parseTitleIdsParam(rawIds);
  if (parsedIds.error) {
    return Response.json({ error: parsedIds.error }, { status: 400 });
  }
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ listIdsByTitle: {} });
  }
  const titleIds = parsedIds.ids;
  if (titleIds.length === 0) {
    return Response.json({ listIdsByTitle: {} });
  }
  const { data: items } = await supabase
    .from("list_items")
    .select("list_id, title_id")
    .in("title_id", titleIds);
  const listIds = [...new Set((items ?? []).map((r) => r.list_id))];
  if (listIds.length === 0) {
    return Response.json({ listIdsByTitle: {} });
  }
  const { data: lists } = await supabase
    .from("lists")
    .select("id")
    .eq("user_id", user.id)
    .in("id", listIds);
  const ownListIds = (lists ?? []).map((r) => r.id);
  const ownListSet = new Set(ownListIds);
  const listIdsByTitle: Record<string, string[]> = {};
  for (const titleId of titleIds) {
    listIdsByTitle[titleId] = (items ?? [])
      .filter(
        (item) => item.title_id === titleId && ownListSet.has(item.list_id),
      )
      .map((item) => item.list_id);
  }
  return Response.json({
    listIdsByTitle,
  });
}
