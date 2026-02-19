import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ lists: [] });
  }
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, is_public, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ lists: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { name, is_public } = body as { name: string; is_public?: boolean };
  if (!name?.trim()) {
    return Response.json({ error: "Missing name" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: user.id, name: name.trim(), is_public: !!is_public })
    .select("id, name, is_public")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
