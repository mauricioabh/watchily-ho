import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/api/validate";
import { UpdateProfileBodySchema } from "@/lib/openapi/schemas";
import { getSupabaseAndUser } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, country_code")
    .eq("id", user.id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? {});
}

export async function PATCH(request: NextRequest) {
  const { client: supabase, user } = await getSupabaseAndUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = parseJsonBody(UpdateProfileBodySchema, body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { display_name, country_code } = parsed.data;
  const updates: {
    display_name?: string;
    country_code?: string;
    updated_at?: string;
  } = {};
  if (display_name !== undefined) updates.display_name = display_name;
  if (country_code !== undefined) updates.country_code = country_code;
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
