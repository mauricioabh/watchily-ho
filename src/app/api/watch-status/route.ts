import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { createClient } from "@/lib/supabase/server";
import { z } from "@/lib/openapi/common";

const WatchStatusBodySchema = z.object({
  title_id: z.string().min(1),
  status: z.enum(["watching", "finished"]),
});

const DeleteQuerySchema = z.object({
  title_id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");
  if (!ids) {
    return Response.json({ statuses: {} });
  }

  const idList = ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (idList.length === 0) {
    return Response.json({ statuses: {} });
  }

  if (!user) {
    return Response.json({ statuses: {} });
  }

  const { data } = await supabase
    .from("user_title_statuses")
    .select("title_id, status")
    .eq("user_id", user.id)
    .in("title_id", idList);

  const statuses: Record<string, "watching" | "finished"> = {};
  for (const row of data ?? []) {
    if (row.status === "watching" || row.status === "finished") {
      statuses[row.title_id] = row.status;
    }
  }

  return Response.json({ statuses });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = parseJsonBody(WatchStatusBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { title_id, status } = parsed.data;
  const { error } = await supabase.from("user_title_statuses").upsert(
    {
      user_id: user.id,
      title_id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,title_id" },
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

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
  const query = DeleteQuerySchema.safeParse({
    title_id: searchParams.get("title_id"),
  });
  if (!query.success) {
    return Response.json({ error: "Missing title_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_title_statuses")
    .delete()
    .eq("user_id", user.id)
    .eq("title_id", query.data.title_id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
