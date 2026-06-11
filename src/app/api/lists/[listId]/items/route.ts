import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { AddListItemBodySchema } from "@/lib/openapi/schemas";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import { isInngestEnabled } from "@/lib/inngest-enabled";
import { inngest } from "@/inngest/client";
import { z } from "@/lib/openapi/common";

const DeleteItemQuerySchema = z.object({
  title_id: z.string().min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
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
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = parseJsonBody(AddListItemBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { title_id, title_type } = parsed.data;
  const { error } = await supabase.from("list_items").insert({
    list_id: listId,
    title_id,
    title_type,
  });
  if (error) {
    if (error.code === "23505") return Response.json({ ok: true });
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (isInngestEnabled()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country_code")
      .eq("id", user.id)
      .single();
    await inngest.send({
      name: "watchlist/item.added",
      data: {
        titleId: title_id,
        countryCode: profile?.country_code ?? "MX",
      },
    });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const query = DeleteItemQuerySchema.safeParse({
    title_id: searchParams.get("title_id"),
  });
  if (!query.success) {
    return Response.json({ error: "Missing title_id" }, { status: 400 });
  }
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("title_id", query.data.title_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
