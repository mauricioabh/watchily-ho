import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomInt } from "crypto";

export const dynamic = "force-dynamic";

/** TV calls this to start pairing. Returns a 6-digit code. */
export async function POST() {
  const supabase = createAdminClient();

  // Generate unique 6-digit code (retry if collision)
  let finalCode = "";
  for (let i = 0; i < 5; i++) {
    const code = randomInt(100000, 999999).toString();
    const { data: existing } = await supabase
      .from("pairing_codes")
      .select("code")
      .eq("code", code)
      .single();
    if (!existing) {
      finalCode = code;
      break;
    }
  }
  if (!finalCode) {
    return NextResponse.json({ error: "No se pudo generar código" }, { status: 500 });
  }

  const { error } = await supabase.from("pairing_codes").insert({
    code: finalCode,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: finalCode });
}
