import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchTitles, getTitleDetails } from "@/lib/streaming/unified";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { getPopularTitles } from "@/lib/streaming/unified";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tileHtml(t: { id: string; name: string; poster?: string | null; type: string; year?: number | null }, base: string) {
  return `
    <a href="${base}/title-standalone/${t.id}" tabindex="0" class="tile-link" style="display:block;text-decoration:none;color:inherit;">
      <div class="tile">
        <div class="tile-poster">
          ${t.poster?.startsWith("http") ? `<img src="${t.poster}" alt="${escapeHtml(t.name)}" loading="lazy" />` : `<div class="tile-placeholder">${escapeHtml(t.name.slice(0,2))}</div>`}
          <span class="tile-badge">${t.type === "series" ? "SERIE" : "PELÍCULA"}</span>
        </div>
        <div class="tile-info">
          <p class="tile-title">${escapeHtml(t.name)}</p>
          ${t.year ? `<span class="tile-year">${t.year}</span>` : ""}
        </div>
      </div>
    </a>`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${BASE}/login-standalone`, 302);
  }

  const { data: profile } = await supabase.from("profiles").select("country_code").eq("id", user.id).single();
  const { data: providerRows } = await supabase.from("user_providers").select("provider_id").eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
  const country = profile?.country_code ?? "MX";

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  let tiles = "";
  let heading = "Películas y series populares";

  if (q) {
    try {
      const result = await searchTitles(q, { country });
      const toEnrich = result.titles.slice(0, 8);
      const enriched = await Promise.allSettled(
        toEnrich.map((t) => getTitleDetails(t.id, { country, region: country }))
      );
      const enrichedTitles = toEnrich.map((original, i) => {
        const settled = enriched[i];
        if (settled.status === "fulfilled" && settled.value) {
          const d = settled.value;
          return { ...d, poster: d.poster ?? original.poster };
        }
        return original;
      });
      const filtered = filterTitlesByUserProviders([...enrichedTitles, ...result.titles.slice(8)], userProviderIds)
        .filter((t) => t.poster?.startsWith("http"));
      tiles = filtered.map((t) => tileHtml(t, BASE)).join("");
      heading = `Resultados para "${escapeHtml(q)}"`;
    } catch {
      heading = "Error al buscar";
    }
  } else {
    const sourceIds = userProviderIds.map((id) => PROVIDER_TO_SOURCE_ID[id]).filter(Boolean) as number[];
    const [movies, series] = await Promise.all([
      getPopularTitles({ type: "movie", enrich: true, sourceIds }),
      getPopularTitles({ type: "series", enrich: true, sourceIds }),
    ]);
    const combined = filterTitlesByUserProviders([...movies, ...series], userProviderIds).slice(0, 20);
    tiles = combined.map((t) => tileHtml(t, BASE)).join("");
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Buscar</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px}
    h1{font-size:48px;margin-bottom:28px;color:#e5b00b}
    nav{margin-bottom:36px;display:flex;gap:16px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:16px 24px;border-radius:10px;font-size:22px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s}
    nav a:hover,nav button:hover,nav a:focus,nav button:focus{background:rgba(99,102,241,0.4);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:3px}
    nav a:nth-child(2){background:#6366f1;border-color:#6366f1}
    .search-wrap{margin-bottom:32px;display:flex;gap:16px;align-items:center}
    .search-wrap input{padding:20px 24px;font-size:28px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;min-width:400px}
    .search-wrap input:focus{outline:3px solid #e5b00b;outline-offset:2px}
    .search-wrap button{padding:20px 32px;font-size:24px;font-weight:600;border-radius:12px;border:none;background:#6366f1;color:#fff;cursor:pointer}
    h2{font-size:32px;margin-bottom:24px;color:#fff}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
    .tile-link:focus{outline:none}
    .tile-link:focus .tile{transform:scale(1.04);border-color:#e5b00b;box-shadow:0 0 0 3px #e5b00b,0 12px 32px rgba(229,176,11,0.25)}
    .tile{background:rgba(26,26,30,0.95);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s}
    .tile-poster{aspect-ratio:2/3;background:#1f1f23;position:relative;overflow:hidden}
    .tile-poster img{width:100%;height:100%;object-fit:cover}
    .tile-placeholder{display:flex;align-items:center;justify-content:center;height:100%;font-size:32px;font-weight:700;color:#555}
    .tile-badge{position:absolute;left:10px;top:10px;background:rgba(0,0,0,0.75);padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600}
    .tile-info{padding:16px}
    .tile-title{font-size:18px;font-weight:600;margin:0 0 4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tile-year{font-size:14px;color:#888}
  </style>
</head>
<body>
  <h1>Buscar</h1>
  <nav>
    <a href="${BASE}/tv-standalone" tabindex="0">Inicio</a>
    <a href="${BASE}/search-standalone" tabindex="0">Buscar</a>
    <a href="${BASE}/lists-standalone" tabindex="0">Listas</a>
    <a href="${BASE}/lists-all-standalone" tabindex="0">Ver todo</a>
    <a href="${BASE}/settings-standalone" tabindex="0">Configuración</a>
    <form action="${BASE}/auth/signout" method="POST" style="display:inline"><input type="hidden" name="redirect" value="/tv-standalone" /><button type="submit" tabindex="0">Cerrar sesión</button></form>
  </nav>
  <form method="GET" action="${BASE}/search-standalone" class="search-wrap">
    <input type="search" name="q" value="${escapeHtml(q)}" placeholder="Película o serie..." id="searchInput" tabindex="0" />
    <button type="submit">Buscar</button>
  </form>
  <h2>${heading}</h2>
  <div class="grid" id="grid">${tiles || "<p style='color:#888;font-size:22px'>No hay resultados.</p>"}</div>
  <script>
    (function(){
      var f=document.querySelectorAll('nav a, nav button, #searchInput, .search-wrap button, .tile-link');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      (document.getElementById('searchInput') || document.querySelector('nav a'))?.focus();
      document.addEventListener('keydown',function(e){
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        var idx=i(document.activeElement);
        if(idx<0)return;
        e.preventDefault();
        var next=-1,cols=4;
        if(e.key==='ArrowRight')next=idx+1;
        else if(e.key==='ArrowLeft')next=idx-1;
        else if(e.key==='ArrowDown')next=idx+cols;
        else if(e.key==='ArrowUp')next=idx-cols;
        if(next>=0&&next<f.length)f[next].focus();
      });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
