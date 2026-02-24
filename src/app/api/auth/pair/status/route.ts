import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** TV polls this to check if code was claimed. Returns status and exchange_token when paired. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("pairing_codes")
    .select("exchange_token, expires_at")
    .eq("code", code)
    .single();

  if (error || !row) {
    return NextResponse.json({ status: "invalid" });
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ status: "expired" });
  }

  if (row.exchange_token) {
    return NextResponse.json({ status: "paired", exchange_token: row.exchange_token });
  }

  return NextResponse.json({ status: "pending" });
}
