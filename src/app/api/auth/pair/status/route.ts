import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/api/validate";
import { PairStatusQuerySchema } from "@/lib/openapi/schemas";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** TV polls this to check if code was claimed. Returns status and exchange_token when paired. */
export async function GET(request: NextRequest) {
  const parsed = parseSearchParams(
    PairStatusQuerySchema,
    request.nextUrl.searchParams,
  );
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { code } = parsed.data;

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
    return NextResponse.json({
      status: "paired",
      exchange_token: row.exchange_token,
    });
  }

  return NextResponse.json({ status: "pending" });
}
