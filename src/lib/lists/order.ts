import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/** Bump all list positions for a user by +1 (for prepend). */
export async function bumpListPositions(
  supabase: Client,
  userId: string,
): Promise<{ error: string | null }> {
  const { data: rows, error } = await supabase
    .from("lists")
    .select("id, position")
    .eq("user_id", userId);
  if (error) return { error: error.message };
  if (!rows?.length) return { error: null };
  const results = await Promise.all(
    rows.map((row) =>
      supabase
        .from("lists")
        .update({ position: row.position + 1 })
        .eq("id", row.id)
        .eq("user_id", userId),
    ),
  );
  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message ?? null };
}

/** Bump all item positions in a list by +1 (for prepend). */
export async function bumpListItemPositions(
  supabase: Client,
  listId: string,
): Promise<{ error: string | null }> {
  const { data: rows, error } = await supabase
    .from("list_items")
    .select("id, position")
    .eq("list_id", listId);
  if (error) return { error: error.message };
  if (!rows?.length) return { error: null };
  const results = await Promise.all(
    rows.map((row) =>
      supabase
        .from("list_items")
        .update({ position: row.position + 1 })
        .eq("id", row.id)
        .eq("list_id", listId),
    ),
  );
  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message ?? null };
}

/** Assign position = index for each list id (must all belong to user). */
export async function applyListOrder(
  supabase: Client,
  userId: string,
  orderedIds: string[],
): Promise<{ error: string | null; status?: number }> {
  const { data: owned, error } = await supabase
    .from("lists")
    .select("id")
    .eq("user_id", userId);
  if (error) return { error: error.message, status: 500 };
  const ownedSet = new Set((owned ?? []).map((r) => r.id));
  if (orderedIds.length !== ownedSet.size) {
    return {
      error: "orderedIds must include every list exactly once",
      status: 400,
    };
  }
  for (const id of orderedIds) {
    if (!ownedSet.has(id)) {
      return { error: "Foreign or unknown list id", status: 403 };
    }
  }
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("lists")
        .update({ position: index })
        .eq("id", id)
        .eq("user_id", userId),
    ),
  );
  const failed = results.find((r) => r.error);
  return {
    error: failed?.error?.message ?? null,
    status: failed ? 500 : undefined,
  };
}

/** Assign position = index for each title_id in a list. */
export async function applyListItemOrder(
  supabase: Client,
  listId: string,
  orderedTitleIds: string[],
): Promise<{ error: string | null; status?: number }> {
  const { data: items, error } = await supabase
    .from("list_items")
    .select("id, title_id")
    .eq("list_id", listId);
  if (error) return { error: error.message, status: 500 };
  const byTitle = new Map((items ?? []).map((r) => [r.title_id, r.id]));
  if (orderedTitleIds.length !== byTitle.size) {
    return {
      error: "orderedIds must include every title in the list exactly once",
      status: 400,
    };
  }
  for (const titleId of orderedTitleIds) {
    if (!byTitle.has(titleId)) {
      return { error: "Unknown title id for this list", status: 400 };
    }
  }
  const results = await Promise.all(
    orderedTitleIds.map((titleId, index) =>
      supabase
        .from("list_items")
        .update({ position: index })
        .eq("id", byTitle.get(titleId)!)
        .eq("list_id", listId),
    ),
  );
  const failed = results.find((r) => r.error);
  return {
    error: failed?.error?.message ?? null,
    status: failed ? 500 : undefined,
  };
}
