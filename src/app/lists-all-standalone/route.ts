import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${BASE}/login-standalone`, 302);
  }

  const { data: providerRows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!lists?.length) {
    return NextResponse.redirect(`${BASE}/lists-standalone`, 302);
  }

  const listIds = lists.map((l) => l.id);
  const { data: items } = await supabase
    .from("list_items")
    .select("list_id, title_id")
    .in("list_id", listIds)
    .order("added_at", { ascending: false });

  const allIds = [...new Set((items ?? []).map((i) => i.title_id))];
  const titles: Awaited<ReturnType<typeof getTitleDetails>>[] = [];
  for (const id of allIds.slice(0, 40)) {
    const t = await getTitleDetails(id);
    if (t) titles.push(t);
  }
  const filtered = filterTitlesByUserProviders(titles, userProviderIds);

  const tiles = filtered
    .map(
      (t) => `
      <a href="${BASE}/title/${t.id}" tabindex="0" class="focusable" style="display:block;text-decoration:none;color:inherit;">
        <div style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
          <div style="aspect-ratio:2/3;background:#2a2a2a;position:relative;">
            ${t.poster?.startsWith("http") ? `<img src="${t.poster}" alt="${escapeHtml(t.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;color:#666;">${escapeHtml(t.name.slice(0,2))}</div>`}
            <span style="position:absolute;left:8px;top:8px;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;font-size:10px;">${t.type === "series" ? "SERIE" : "PELÍCULA"}</span>
          </div>
          <div style="padding:12px;">
            <p style="font-size:14px;font-weight:600;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.name)}</p>
            ${t.year ? `<span style="font-size:11px;color:#888;">${t.year}</span>` : ""}
          </div>
        </div>
      </a>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Ver todo</title>
  <script src="https://cdn.jsdelivr.net/npm/js-spatial-navigation@1.0.1/spatial_navigation.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:40px}
    h1{font-size:42px;margin-bottom:24px;color:#e5b00b}
    nav{margin-bottom:32px;display:flex;gap:12px;flex-wrap:wrap}
    nav a{display:inline-block;padding:12px 20px;border-radius:8px;font-size:16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
    a:focus{outline:3px solid #e5b00b;outline-offset:4px}
    .grid a:focus>div{border-color:#e5b00b!important;box-shadow:0 0 0 2px #e5b00b}
  </style>
</head>
<body>
  <h1>Ver todo</h1>
  <nav id="nav">
    <a href="${BASE}/tv-standalone" tabindex="0">Inicio</a>
    <a href="${BASE}/lists-standalone" tabindex="0">← Mis listas</a>
  </nav>
  <div class="grid" id="grid">${tiles}</div>
  <script>
    (function(){
      if(typeof SpatialNavigation==="undefined"){setTimeout(function(){var f=document.querySelector("a");if(f)f.focus()},100);return}
      SpatialNavigation.init();
      SpatialNavigation.add("main",{selector:"#nav a, .grid a"});
      SpatialNavigation.makeFocusable();
      SpatialNavigation.focus();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
