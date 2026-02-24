import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/** Web: logged-in user claims the code. Stores their session for TV to exchange. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = body?.code?.toString()?.trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Inicia sesión primero" }, { status: 401 });
  }

  const exchangeToken = randomUUID();
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("pairing_codes")
    .select("code, expires_at")
    .eq("code", code)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Código no encontrado" }, { status: 404 });
  }

  if (new Date(existing.expires_at) < new Date()) {
    return NextResponse.json({ error: "Código expirado" }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("pairing_codes")
    .update({
      user_id: session.user.id,
      refresh_token: session.refresh_token,
      exchange_token: exchangeToken,
    })
    .eq("code", code);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
