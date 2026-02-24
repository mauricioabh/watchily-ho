import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** TV calls this with code+exchange_token to receive the session (sets cookies). */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = body?.code?.toString()?.trim();
  const exchangeToken = body?.exchange_token?.toString()?.trim();

  if (!code || !exchangeToken) {
    return NextResponse.json({ error: "Código y token requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error: fetchError } = await admin
    .from("pairing_codes")
    .select("refresh_token, user_id")
    .eq("code", code)
    .eq("exchange_token", exchangeToken)
    .single();

  if (fetchError || !row || !row.refresh_token) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session }, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: row.refresh_token,
  });

  if (refreshError || !session) {
    await admin.from("pairing_codes").delete().eq("code", code);
    return NextResponse.json({ error: "Sesión expirada. Intenta de nuevo." }, { status: 400 });
  }

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? row.refresh_token,
  });

  await admin.from("pairing_codes").delete().eq("code", code);

  return NextResponse.json({ ok: true });
}
