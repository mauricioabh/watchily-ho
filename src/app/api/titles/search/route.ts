import { NextRequest } from "next/server";
import { searchTitles } from "@/lib/streaming/unified";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type"); // movie | series
  const country = searchParams.get("country") ?? "US";

  if (!q || q.trim().length === 0) {
    return Response.json({ titles: [], totalCount: 0 });
  }

  try {
    const types = type ? ([type] as ("movie" | "series")[]) : undefined;
    const result = await searchTitles(q.trim(), { types, country });
    return Response.json(result);
  } catch (e) {
    console.error("Search error:", e);
    return Response.json({ titles: [], totalCount: 0 }, { status: 500 });
  }
}
