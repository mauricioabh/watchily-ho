import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/** Client with user session (cookies). Use in API routes and Server Components. RLS applies. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

/**
 * Client that works for BOTH web (cookies) and mobile (Authorization: Bearer <token>).
 * Checks the Bearer token first; falls back to cookie-based session.
 * Use this in all API routes that mobile also calls.
 */
export async function createClientForRequest() {
  const headerStore = await headers();
  const auth = headerStore.get("authorization") ?? headerStore.get("Authorization");

  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    // Lightweight client — validates JWT with Supabase and respects RLS
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
    return client;
  }

  // No Bearer token — use cookie-based session (web)
  return createClient();
}

/** Server-only admin client (bypasses RLS). Use only for trusted server logic, never expose. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is required for createAdminClient");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false } }
  );
}
