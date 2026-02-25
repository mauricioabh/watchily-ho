import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { tvNavHtml, tvNavCss, tvLogoutScript } from "@/lib/tv-shared";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${BASE}/login-standalone`, 302);
  }

  const { data: profile } = await supabase.from("profiles").select("country_code").eq("id", user.id).single();
  const { data: providerRows } = await supabase.from("user_providers").select("provider_id").eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
  const country = profile?.country_code ?? "MX";

  const title = await getTitleDetails(id, { region: country, country });
  if (!title) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>No encontrado</title></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;padding:48px"><h1>No encontrado</h1><p><a href="${BASE}/tv-standalone" style="color:#60a5fa">Volver al inicio</a></p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const filtered = filterTitlesByUserProviders([title], userProviderIds);
  const t = filtered[0] ?? { ...title, sources: [] };

  const seen = new Set<string>();
  const uniqueSources = (t.sources ?? []).filter((s) => {
    const key = `${s.providerName}-${s.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const subSources = uniqueSources.filter((s) => s.type === "sub");
  const paidSources = uniqueSources.filter((s) => s.type !== "sub");

  const typeLabel = (s: { type: string }) =>
    s.type === "sub" ? "Incluido" : s.type === "rent" ? "Alquiler" : s.type === "buy" ? "Compra" : "Gratis";

  const webOSAppIds: Record<string, string> = {
    netflix: "netflix",
    "disney+": "com.disney.disneyplus-prod",
    "disney plus": "com.disney.disneyplus-prod",
    "hbo max": "com.hbo.hbomax",
    hbomax: "com.hbo.hbomax",
  };
  const sourceCards = (sources: typeof uniqueSources) =>
    sources
      .map(
        (s) => {
          const url = s.url ?? "#";
          const provider = (s.providerName ?? "").toLowerCase().replace(/\s+/g, " ");
          const appId = webOSAppIds[provider] ?? webOSAppIds[provider.replace(" ", "")];
          return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="source-link" data-url="${escapeHtml(url)}" data-app-id="${appId ?? ""}">
      <span class="source-name">${escapeHtml(s.providerName)}</span>
      <span class="source-type">${typeLabel(s)}${s.quality ? ` · ${s.quality}` : ""}${s.price != null ? ` · $${s.price}` : ""}</span>
    </a>`;
        }
      )
      .join("");

  const scores: string[] = [];
  if (t.imdbRating != null) scores.push(`<div class="score"><span class="score-label">IMDb</span><span class="score-value" style="color:#f5c518">${t.imdbRating.toFixed(1)}</span></div>`);
  if (t.userRating != null) scores.push(`<div class="score"><span class="score-label">Usuario</span><span class="score-value" style="color:#60a5fa">${t.userRating.toFixed(1)}</span></div>`);
  if (t.criticScore != null) scores.push(`<div class="score"><span class="score-label">Crítica</span><span class="score-value">${t.criticScore}%</span></div>`);
  if (t.rottenTomatoesRating != null) scores.push(`<div class="score"><span class="score-label">RT</span><span class="score-value">${t.rottenTomatoesRating}%</span></div>`);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - ${escapeHtml(t.name)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:0}
    .page{padding:32px 48px 48px}
    ${tvNavCss}
    .hero{display:flex;gap:120px;margin-bottom:36px}
    .poster-wrap{flex-shrink:0;width:240px;aspect-ratio:2/3;border-radius:12px;overflow:hidden;background:#1f1f23;margin-right:24px}
    .poster-wrap img{width:100%;height:100%;object-fit:cover}
    .poster-placeholder{display:flex;align-items:center;justify-content:center;height:100%;font-size:42px;font-weight:700;color:#555}
    .info{flex:1;min-width:0}
    .info h2{font-size:34px;margin-bottom:12px;line-height:1.2}
    .meta{font-size:20px;color:#888;margin-bottom:18px}
    .meta span{margin-right:14px}
    .overview{font-size:22px;line-height:1.5;max-width:700px;margin-bottom:24px;color:#ccc}
    .scores{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:24px}
    .score{display:flex;flex-direction:column;align-items:center;padding:14px 20px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)}
    .score-label{font-size:16px;color:#888}
    .score-value{font-size:24px;font-weight:700;margin-top:4px}
    .actions{margin-bottom:32px;display:flex;gap:16px;flex-wrap:wrap}
    .btn-bookmark,.trailer-link{display:inline-flex;align-items:center;gap:8px;padding:18px 28px;border-radius:10px;font-size:24px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff}
    .btn-bookmark{color:#e5b00b}
    .btn-bookmark:hover,.btn-bookmark:focus,.trailer-link:hover,.trailer-link:focus{background:rgba(99,102,241,0.4);outline:3px solid #e5b00b;outline-offset:2px}
    section{margin-bottom:28px}
    section h3{font-size:26px;margin-bottom:14px;color:#e5b00b}
    .sources-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .source-link{display:block;padding:24px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s;font-size:20px}
    .source-link:hover,.source-link:focus{background:rgba(99,102,241,0.3);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:2px}
    .source-name{display:block;font-size:22px;font-weight:600;margin-bottom:6px}
    .source-type{font-size:18px;color:#888}
  </style>
</head>
<body>
  ${tvNavHtml(BASE, "none", "vertodo")}
  <main class="page">
  <div class="hero">
    <div class="poster-wrap">
      ${t.poster?.startsWith("http") ? `<img src="${t.poster}" alt="${escapeHtml(t.name)}" />` : `<div class="poster-placeholder">${escapeHtml(t.name.slice(0,2))}</div>`}
    </div>
    <div class="info">
      <h2>${escapeHtml(t.name)}</h2>
      ${t.originalName && t.originalName !== t.name ? `<p class="meta">${escapeHtml(t.originalName)}</p>` : ""}
      <div class="meta">
        ${t.type === "series" ? "<span>SERIE</span>" : ""}
        ${t.year != null ? `<span>${t.year}</span>` : ""}
        ${t.runtime != null ? `<span>${t.runtime} min</span>` : ""}
        ${t.genres?.length ? `<span>${t.genres.slice(0, 3).join(" · ")}</span>` : ""}
      </div>
      ${scores.length ? `<div class="scores">${scores.join("")}</div>` : ""}
      ${t.overview ? `<p class="overview">${escapeHtml(t.overview)}</p>` : ""}
      <div class="actions">
        <a href="${BASE}/title-standalone/${t.id}/add-to-list" tabindex="0" class="btn-bookmark">⊕ Añadir a lista</a>
        ${t.trailer ? `<a href="${escapeHtml(t.trailer)}" target="_blank" rel="noopener noreferrer" class="trailer-link" tabindex="0">▶ Ver tráiler</a>` : ""}
      </div>
    </div>
  </div>
  ${subSources.length ? `<section><h3>Disponible con suscripción</h3><div class="sources-grid">${sourceCards(subSources)}</div></section>` : ""}
  ${paidSources.length ? `<section><h3>Alquiler / Compra</h3><div class="sources-grid">${sourceCards(paidSources)}</div></section>` : ""}
  ${uniqueSources.length === 0 ? `<p style="color:#888;font-size:24px">No hay fuentes de streaming disponibles para esta región.</p>` : ""}
  </main>
  <script>
    (function(){
      function openStreaming(url,appId){
        if(appId&&typeof webOS!=='undefined'&&webOS.service){
          try{
            webOS.service.request('luna://com.webos.applicationManager',{
              method:'launch',
              parameters:{id:appId},
              onSuccess:function(){},
              onFailure:function(){window.open(url);}
            });
          }catch(e){window.open(url);}
        }else{window.open(url);}
      }
      document.addEventListener('click',function(e){
        var el=e.target?.closest?.('.source-link');
        if(!el||!el.href||el.href==='#')return;
        var url=el.getAttribute('data-url')||el.href;
        var appId=el.getAttribute('data-app-id');
        if(url&&url!=='#'){
          e.preventDefault();
          openStreaming(url,appId||'');
        }
      },true);
      var f=document.querySelectorAll('.tv-nav a, .tv-nav button, .btn-bookmark, .trailer-link, .source-link');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      var navCount=6;
      var vertodoBtn=document.getElementById('firstFocus');
      function focusVertodo(){if(vertodoBtn)vertodoBtn.focus();else f[0]?.focus()}
      focusVertodo();
      setTimeout(focusVertodo,600);
      setTimeout(focusVertodo,800);
      setTimeout(focusVertodo,1200);
      setTimeout(focusVertodo,1800);
      document.addEventListener('keydown',function(e){
        var isActivate=e.key==='Enter'||e.key===' '||e.keyCode===13||e.keyCode===28;
        if(isActivate){
          var el=document.activeElement;
          var srcLink=el?.closest?.('.source-link');
          if(srcLink){
            var url=srcLink.getAttribute('data-url')||srcLink.href;
            var appId=srcLink.getAttribute('data-app-id')||'';
            if(url&&url!=='#'){
              e.preventDefault();
              openStreaming(url,appId);
              return;
            }
          }
          if(el&&el.tagName==='A'&&el.href){el.click();e.preventDefault();}
          return;
        }
        var idx=i(document.activeElement);
        if(idx<0){focusVertodo();e.preventDefault();return;}
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();
        var next=-1;
        var firstSource=null;
        for(var s=navCount;s<f.length;s++)if(f[s].classList&&f[s].classList.contains('source-link')){firstSource=f[s];break;}
        if(e.key==='ArrowRight')next=idx+1;
        else if(e.key==='ArrowLeft')next=idx-1;
        else if(e.key==='ArrowDown'){
          if(idx<navCount)next=navCount;
          else if(idx===navCount)next=firstSource?i(firstSource):idx+1;
          else next=idx+1;
        }else if(e.key==='ArrowUp')next=idx>0?idx-1:0;
        if(next>=0&&next<f.length)f[next].focus();
      },true);
    })();
  </script>
  <script>${tvLogoutScript()}</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
