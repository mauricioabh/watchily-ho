import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { ReorderListsBodySchema } from "@/lib/openapi/schemas";
import { applyListOrder } from "@/lib/lists/order";
import { getSupabaseAndUser } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = parseJsonBody(ReorderListsBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const result = await applyListOrder(
    supabase,
    user.id,
    parsed.data.orderedIds,
  );
  if (result.error) {
    return Response.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }
  return Response.json({ ok: true });
}
