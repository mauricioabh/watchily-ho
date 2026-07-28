import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { UpdateLibraryPrefsBodySchema } from "@/lib/openapi/schemas";
import { getSupabaseAndUser } from "@/lib/supabase/server";
import type { LibraryPrefs } from "@/types/library";

function normalizePrefs(
  row: {
    library_status_filter: string | null;
    library_title_sort: string | null;
  } | null,
): LibraryPrefs {
  const statusFilter =
    row?.library_status_filter === "watching" ||
    row?.library_status_filter === "finished"
      ? row.library_status_filter
      : "all";
  const titleSort =
    row?.library_title_sort === "asc" || row?.library_title_sort === "desc"
      ? row.library_title_sort
      : "custom";
  return { statusFilter, titleSort };
}

export async function GET() {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("library_status_filter, library_title_sort")
    .eq("id", user.id)
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(normalizePrefs(data));
}

export async function PATCH(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = parseJsonBody(UpdateLibraryPrefsBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const updates: {
    library_status_filter?: string;
    library_title_sort?: string;
    updated_at?: string;
  } = { updated_at: new Date().toISOString() };
  if (parsed.data.statusFilter !== undefined) {
    updates.library_status_filter = parsed.data.statusFilter;
  }
  if (parsed.data.titleSort !== undefined) {
    updates.library_title_sort = parsed.data.titleSort;
  }
  if (
    parsed.data.statusFilter === undefined &&
    parsed.data.titleSort === undefined
  ) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("library_status_filter, library_title_sort")
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(normalizePrefs(data));
}
