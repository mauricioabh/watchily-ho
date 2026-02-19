import { NextRequest } from "next/server";
import { getPopularTitles } from "@/lib/streaming/unified";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // movie | series
  const country = searchParams.get("country") ?? "US";

  try {
    const titles = await getPopularTitles({
      type: type === "series" ? "series" : "movie",
      country,
    });
    return Response.json({ titles });
  } catch (e) {
    console.error("Popular titles error:", e);
    return Response.json({ titles: [] }, { status: 500 });
  }
}
