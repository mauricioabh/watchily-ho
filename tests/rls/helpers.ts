import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";
import { expect } from "vitest";

const DEFAULT_URL = "http://127.0.0.1:54321";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const DEFAULT_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQv8Hdp7fsxs3T8Y1_YbIg";

function envKey(...candidates: Array<string | undefined>): string | undefined {
  for (const value of candidates) {
    if (value && value !== "null") {
      return value;
    }
  }
  return undefined;
}

export function supabaseUrl(): string {
  return envKey(process.env.SUPABASE_URL) ?? DEFAULT_URL;
}

export function anonKey(): string {
  return (
    envKey(
      process.env.SUPABASE_ANON_KEY,
      process.env.SUPABASE_PUBLISHABLE_KEY,
    ) ?? DEFAULT_ANON_KEY
  );
}

export function serviceRoleKey(): string {
  return (
    envKey(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.SUPABASE_SECRET_KEY,
    ) ?? DEFAULT_SERVICE_KEY
  );
}

export function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): SupabaseClient {
  return createClient(supabaseUrl(), anonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function dbUrl(): string {
  return (
    envKey(process.env.SUPABASE_DB_URL, process.env.DB_URL) ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  );
}

async function withPg<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: dbUrl() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function ensureProfile(id: string, email: string): Promise<void> {
  await withPg((client) =>
    client.query(
      "INSERT INTO public.profiles (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
      [id, email],
    ),
  );
}

export async function seedList(
  userId: string,
  name: string,
  isPublic: boolean,
): Promise<string> {
  const result = await withPg((client) =>
    client.query<{ id: string }>(
      "INSERT INTO public.lists (user_id, name, is_public) VALUES ($1, $2, $3) RETURNING id",
      [userId, name, isPublic],
    ),
  );
  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error("seedList failed");
  }
  return id;
}

export async function seedLike(
  userId: string,
  titleId: string,
  titleType: "movie" | "series",
): Promise<void> {
  await withPg((client) =>
    client.query(
      "INSERT INTO public.likes (user_id, title_id, title_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, titleId, titleType],
    ),
  );
}

export async function createTestUser(
  label: string,
  password = "test-password-123",
): Promise<{ id: string; email: string; client: SupabaseClient }> {
  const email = `${label}-${crypto.randomUUID()}@rls-test.local`;
  const admin = serviceClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser(${label}): ${error?.message ?? "no user"}`);
  }

  const client = anonClient();
  const { data: signInData, error: signInError } =
    await client.auth.signInWithPassword({
      email,
      password,
    });
  if (signInError || !signInData.session) {
    throw new Error(
      `signIn(${label}): ${signInError?.message ?? "no session"}`,
    );
  }

  const accessToken = signInData.session.access_token;
  const userClient = createClient(supabaseUrl(), anonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await ensureProfile(data.user.id, email);

  return { id: data.user.id, email, client: userClient };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await serviceClient().auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`deleteUser(${userId}): ${error.message}`);
  }
}

/** RLS deny: PostgREST may return empty rows or a 42501 permission error. */
export function expectNoRowAccess(result: {
  data: unknown;
  error: { code?: string } | null;
}): void {
  if (result.error) {
    expect(result.error.code).toBe("42501");
  } else {
    expect(result.data).toEqual([]);
  }
}
