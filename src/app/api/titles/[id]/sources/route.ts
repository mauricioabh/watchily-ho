import { NextRequest } from "next/server";
import { getTitleDetails } from "@/lib/streaming/unified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? searchParams.get("country") ?? "US";

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const title = await getTitleDetails(id, { region, country: region });
    if (!title) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ sources: title.sources ?? [] });
  } catch (e) {
    console.error("Sources error:", e);
    return Response.json({ sources: [] }, { status: 500 });
  }
}
