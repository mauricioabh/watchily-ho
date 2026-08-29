import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { ReorderListItemsBodySchema } from "@/lib/openapi/schemas";
import { applyListItemOrder } from "@/lib/lists/order";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import { invalidateLibraryCatalog } from "@/lib/library-cache";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: list } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();
  if (!list) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = parseJsonBody(ReorderListItemsBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const result = await applyListItemOrder(
    supabase,
    listId,
    parsed.data.orderedIds,
  );
  if (result.error) {
    return Response.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }
  await invalidateLibraryCatalog(user.id);
  return Response.json({ ok: true });
}
