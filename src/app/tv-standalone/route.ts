import { NextResponse } from "next/server";
import { getPopularTitles } from "@/lib/streaming/unified";
import { createClient } from "@/lib/supabase/server";
import { PROVIDER_TO_SOURCE_ID, filterTitlesByUserProviders } from "@/lib/streaming/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        (process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app") + "/login-standalone",
        302
      );
    }

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
        (t, i) => `
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
        </a>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      background:linear-gradient(180deg,#0b1120 0%,#080c18 30%,#060810 65%,#05070d 100%);
      color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px
    }
    h1{font-size:48px;margin-bottom:28px;color:#e5b00b}
    nav{margin-bottom:36px;display:flex;gap:16px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:16px 24px;border-radius:10px;font-size:22px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s}
    nav a:hover,nav button:hover,nav a:focus,nav button:focus{background:rgba(99,102,241,0.4);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:3px}
    nav a:first-child{background:#6366f1;border-color:#6366f1}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
    .tile-link{outline:none}
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
  <h1>Watchily</h1>
  <nav id="nav">
    <a href="${base}/tv-standalone" tabindex="0" id="firstFocus">Inicio</a>
    <a href="${base}/search-standalone" tabindex="0">Buscar</a>
    <a href="${base}/lists-standalone" tabindex="0">Listas</a>
    <a href="${base}/lists-all-standalone" tabindex="0">Ver todo</a>
    <a href="${base}/settings-standalone" tabindex="0">Configuración</a>
    <form action="${base}/auth/signout" method="POST" style="display:inline"><input type="hidden" name="redirect" value="/tv-standalone" /><button type="submit" tabindex="0">Cerrar sesión</button></form>
  </nav>
  <div class="grid" id="grid">${tiles}</div>
  <script>
    (function(){
      var focusables=document.querySelectorAll('nav a, nav button, .tile-link');
      var inicio=document.getElementById("firstFocus");
      function idxOf(el){for(var i=0;i<focusables.length;i++)if(focusables[i]===el)return i;return -1}
      function focusInicio(){if(inicio)inicio.focus()}
      focusInicio();
      document.addEventListener('keydown',function(e){
        var idx=idxOf(document.activeElement);
        if(idx<0){
          focusInicio();
          e.preventDefault();
          return;
        }
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();
        var next=-1,navCount=6,cols=4;
        if(e.key==='ArrowRight')next=idx+1;
        else if(e.key==='ArrowLeft')next=idx-1;
        else if(e.key==='ArrowDown'){
          if(idx<navCount)next=navCount+(idx%cols);
          else next=idx+cols;
        }else if(e.key==='ArrowUp'){
          if(idx>=navCount)next=(idx-navCount)%cols;
          else next=idx-cols;
        }
        if(next>=0&&next<focusables.length)focusables[next].focus();
      },true);
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
