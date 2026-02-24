import { NextResponse } from "next/server";
import { getPopularTitles } from "@/lib/streaming/unified";
import { createClient } from "@/lib/supabase/server";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: providerRows } = user
      ? await supabase.from("user_providers").select("provider_id").eq("user_id", user.id)
      : { data: [] as { provider_id: string }[] };

    const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
    const sourceIds = userProviderIds
      .map((id) => PROVIDER_TO_SOURCE_ID[id])
      .filter(Boolean) as number[];

    const [movies, series] = await Promise.all([
      getPopularTitles({ type: "movie", enrich: true, sourceIds }),
      getPopularTitles({ type: "series", enrich: true, sourceIds }),
    ]);

    const combined = filterTitlesByUserProviders([...movies, ...series], userProviderIds).slice(0, 20);

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";
    const tiles = combined
      .map(
        (t) => `
        <a href="${base}/title/${t.id}" tabindex="0" class="focusable" style="display:block;text-decoration:none;color:inherit;">
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
  <title>Watchily</title>
  <script src="https://cdn.jsdelivr.net/npm/js-spatial-navigation@1.0.1/spatial_navigation.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:40px}
    h1{font-size:42px;margin-bottom:24px;color:#e5b00b}
    nav{margin-bottom:32px;display:flex;gap:12px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:12px 20px;border-radius:8px;font-size:16px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none}
    nav a:first-child{background:#6366f1;border-color:#6366f1}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
    a:focus,button:focus{outline:3px solid #e5b00b;outline-offset:4px}
    .grid a:focus>div{border-color:#e5b00b!important;box-shadow:0 0 0 2px #e5b00b}
  </style>
</head>
<body>
  <h1>Watchily</h1>
  <nav id="nav">
    <a href="${base}/tv-standalone" tabindex="0" class="focusable">Inicio</a>
    <a href="${base}/search?device=tv" tabindex="0" class="focusable">Buscar</a>
    <a href="${base}/lists-standalone" tabindex="0" class="focusable">Listas</a>
    <a href="${base}/lists-all-standalone" tabindex="0" class="focusable">Ver todo</a>
    ${user ? `<form action="${base}/auth/signout" method="POST" style="display:inline"><input type="hidden" name="redirect" value="/tv-standalone" /><button type="submit" tabindex="0" class="focusable">Cerrar sesión</button></form>` : `<a href="${base}/login-standalone" tabindex="0" class="focusable">Iniciar sesión</a>`}
  </nav>
  <div class="grid" id="grid">${tiles}</div>
  <script>
    (function(){
      if(typeof SpatialNavigation==="undefined"){setTimeout(function(){var f=document.querySelector("a");if(f)f.focus()},100);return}
      SpatialNavigation.init();
      SpatialNavigation.add("main",{selector:"#nav a, #nav button, .grid a",defaultElement:"#nav a"});
      SpatialNavigation.makeFocusable();
      SpatialNavigation.setDefaultSection("main");
      SpatialNavigation.focus();
    })();
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("tv-standalone error:", e);
    const fallback = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Watchily</title></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;padding:48px"><h1>Watchily</h1><p>Error al cargar. <a href="https://watchily-ho.vercel.app" style="color:#60a5fa">Ir a la web</a></p></body></html>`;
    return new NextResponse(fallback, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
