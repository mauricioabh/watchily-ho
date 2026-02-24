import { supabase } from "./supabase";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // No session available
  }
  return {};
}

export async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  profile: {
    get: () => fetchApi<{ country_code?: string; display_name?: string }>("/api/profile"),
    update: (data: { country_code?: string; display_name?: string }) =>
      fetchApi("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
  },
  profileProviders: {
    get: () =>
      fetchApi<{ providers: { id: string; name: string }[]; selectedIds: string[] }>("/api/profile/providers"),
    update: (providerIds: string[]) =>
      fetchApi("/api/profile/providers", {
        method: "PUT",
        body: JSON.stringify({ providerIds }),
      }),
  },
  titles: {
    search: (q: string) => fetchApi<{ titles: unknown[] }>(`/api/titles/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => fetchApi<unknown>(`/api/titles/${id}`),
    popular: (type?: "movie" | "series") =>
      fetchApi<{ titles: unknown[] }>(`/api/titles/popular${type ? `?type=${type}` : ""}`),
  },
  lists: {
    all: () => fetchApi<{ lists: { id: string; name: string; is_public: boolean; created_at: string; item_count?: number }[] }>("/api/lists"),
    getItems: (listId: string) =>
      fetchApi<{ items: { id?: string; title_id: string; title_type: string; added_at?: string }[] }>(
        `/api/lists/${listId}/items`
      ),
    forTitle: (titleId: string) =>
      fetchApi<{ listIdsByTitle: Record<string, string[]> }>(`/api/lists/items?title_id=${encodeURIComponent(titleId)}`),
    addItem: (listId: string, titleId: string, titleType: string) =>
      fetchApi(`/api/lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify({ title_id: titleId, title_type: titleType }),
      }),
    removeItem: (listId: string, titleId: string) =>
      fetchApi(`/api/lists/${listId}/items?title_id=${titleId}`, { method: "DELETE" }),
    create: (name: string) =>
      fetchApi<{ id: string; name: string }>("/api/lists", {
        method: "POST",
        body: JSON.stringify({ name, is_public: false }),
      }),
  },
};
