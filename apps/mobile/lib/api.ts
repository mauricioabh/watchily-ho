const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  titles: {
    search: (q: string) => fetchApi<{ titles: unknown[] }>(`/api/titles/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => fetchApi<unknown>(`/api/titles/${id}`),
    popular: (type?: "movie" | "series") =>
      fetchApi<{ titles: unknown[] }>(`/api/titles/popular${type ? `?type=${type}` : ""}`),
  },
  lists: () => fetchApi<{ lists: unknown[] }>("/api/lists"),
};
