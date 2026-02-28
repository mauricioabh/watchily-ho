import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { tvNavHtml, tvNavCss, tvLogoutScript, tvLogoutModalCheck, tvLogoutModalCheckKeydown } from "@/lib/tv-shared";

export const dynamic = "force-dynamic";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${BASE}/login-standalone`, 302);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("country_code")
    .eq("id", user.id)
    .single();
  const { data: providerRows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const userProviderIds = (providerRows ?? []).map((r) => r.provider_id);
  const country = profile?.country_code ?? "MX";

  const title = await getTitleDetails(id, { region: country, country });
  if (!title) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>No encontrado</title></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;padding:48px"><h1>No encontrado</h1><p><a href="${BASE}/tv-standalone" style="color:#60a5fa">Volver al inicio</a></p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
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
    s.type === "sub"
      ? "Incluido"
      : s.type === "rent"
        ? "Alquiler"
        : s.type === "buy"
          ? "Compra"
          : "Gratis";

  const webOSAppIds: Record<string, string> = {
    netflix: "netflix",
    "disney+": "com.disney.disneyplus-prod",
    "disney plus": "com.disney.disneyplus-prod",
    disneyplus: "com.disney.disneyplus-prod",
    "hbo max": "com.hbo.hbomax",
    hbomax: "com.hbo.hbomax",
    max: "com.hbo.hbomax",
    "amazon prime video": "amazon",
    "amazon prime": "amazon",
    "prime video": "amazon",
    prime: "amazon",
    amazon: "amazon",
    crunchyroll: "com.crunchyroll.webos",
    "crunchy roll": "com.crunchyroll.webos",
    "paramount+": "com.paramount.paramountplus",
    paramountplus: "com.paramount.paramountplus",
    "apple tv+": "com.apple.appletv",
    appletv: "com.apple.appletv",
    "apple tv plus": "com.apple.appletv",
  };
  function resolveWebOSAppId(providerName: string): string | undefined {
    const raw = (providerName ?? "").toLowerCase().trim();
    const normalized = raw.replace(/\s+/g, " ").replace(/[+]/g, "");
    const noSpaces = raw.replace(/\s+/g, "").replace(/[+]/g, "");
    return (
      webOSAppIds[raw] ??
      webOSAppIds[normalized] ??
      webOSAppIds[noSpaces] ??
      webOSAppIds[raw.replace(/\s+/g, "")] ??
      (raw.includes("prime") || raw.includes("amazon") ? "amazon" : undefined) ??
      (raw.includes("crunchy") ? "com.crunchyroll.webos" : undefined) ??
      (raw.includes("paramount") ? "com.paramount.paramountplus" : undefined) ??
      (raw.includes("hbo") || raw.includes("max") ? "com.hbo.hbomax" : undefined) ??
      (raw.includes("disney") ? "com.disney.disneyplus-prod" : undefined) ??
      (raw.includes("netflix") ? "netflix" : undefined)
    );
  }
  const sourceCards = (sources: typeof uniqueSources) =>
    sources
      .map((s) => {
        const url = s.url ?? "#";
        const appId = resolveWebOSAppId(s.providerName ?? "");
        return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="source-link" data-url="${escapeHtml(url)}" data-app-id="${appId ?? ""}">
      <span class="source-name">${escapeHtml(s.providerName)}</span>
      <span class="source-type">${typeLabel(s)}${s.quality ? ` · ${s.quality}` : ""}${s.price != null ? ` · $${s.price}` : ""}</span>
    </a>`;
      })
      .join("");

  const scores: string[] = [];
  if (t.imdbRating != null)
    scores.push(
      `<div class="score"><span class="score-label">IMDb</span><span class="score-value" style="color:#f5c518">${t.imdbRating.toFixed(1)}</span></div>`,
    );
  if (t.userRating != null)
    scores.push(
      `<div class="score"><span class="score-label">Usuario</span><span class="score-value" style="color:#60a5fa">${t.userRating.toFixed(1)}</span></div>`,
    );
  if (t.criticScore != null)
    scores.push(
      `<div class="score"><span class="score-label">Crítica</span><span class="score-value">${t.criticScore}%</span></div>`,
    );
  if (t.rottenTomatoesRating != null)
    scores.push(
      `<div class="score"><span class="score-label">RT</span><span class="score-value">${t.rottenTomatoesRating}%</span></div>`,
    );

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <script src="https://cdn.jsdelivr.net/npm/webostvjs@1.2.4/webOSTV.js"></script>
  <!-- webOSTV.js sin defer/async para que esté disponible antes del resto del script -->
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
    .diag-section{margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1)}
    .diag-section h3{font-size:20px;color:#888;margin-bottom:12px}
    .diag-btns{display:flex;gap:12px;flex-wrap:wrap}
    .diag-btn{padding:14px 24px;border-radius:8px;font-size:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-family:inherit}
    .diag-btn:hover,.diag-btn:focus{background:rgba(99,102,241,0.3);outline:3px solid #e5b00b;outline-offset:2px}
  </style>
</head>
<body>
  ${tvNavHtml(BASE, "none", "vertodo")}
  <main class="page">
  <div class="hero">
    <div class="poster-wrap">
      ${t.poster?.startsWith("http") ? `<img src="${t.poster}" alt="${escapeHtml(t.name)}" />` : `<div class="poster-placeholder">${escapeHtml(t.name.slice(0, 2))}</div>`}
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
  <section class="diag-section">
    <h3>Diagnóstico rápido</h3>
    <div class="diag-btns">
      <button type="button" class="diag-btn" tabindex="0" data-app-id="com.crunchyroll.webos" data-fallback-url="https://www.crunchyroll.com">PROBAR CRUNCHYROLL</button>
      <button type="button" class="diag-btn" tabindex="0" data-app-id="com.hbo.hbomax" data-fallback-url="https://www.max.com">PROBAR MAX</button>
    </div>
  </section>
  </main>
  <script>
    /* Flujo control remoto: .cursor/skills/tv-remote-control-flow */
    (function(){
      var f=document.querySelectorAll('.tv-nav a, .tv-nav button, .btn-bookmark, .trailer-link, .source-link, .diag-btn');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      var navCount=6;
      var firstSource=null,firstSourceIdx=-1;
      for(var s=navCount;s<f.length;s++)if(f[s].classList&&f[s].classList.contains('source-link')){firstSource=f[s];firstSourceIdx=i(firstSource);break;}
      var sourceCols=3;

      function getFirstFocus(){
        var el=document.getElementById('firstFocus');
        if(el)return el;
        return document.querySelector('a[href*="lists-all-standalone"]')||f[0];
      }
      function focusFirst(){
        ${tvLogoutModalCheck}
        var active=document.activeElement;
        if(active&&active!==document.body){var idx=i(active);if(idx>=0)return}
        var btn=getFirstFocus();if(btn)btn.focus();
      }
      [0,100,400,800,1500,3000,5000].forEach(function(ms){setTimeout(focusFirst,ms)});
      if(document.readyState!=='complete')window.addEventListener('load',function(){[0,100,400].forEach(function(ms){setTimeout(focusFirst,ms)})});

      function extractContentId(url){
        if(!url||typeof url!=='string')return null;
        var entityMatch=url.match(/entity-([a-f0-9-]{36})/i);
        if(entityMatch)return entityMatch[1];
        var crunchyMatch=url.match(/crunchyroll[^/]*\\/watch\\/([A-Za-z0-9]+)/i);
        if(crunchyMatch)return crunchyMatch[1];
        var crunchySeries=url.match(/crunchyroll[^/]*\\/series\\/[^/]+\\/([A-Za-z0-9]{8,})/i);
        if(crunchySeries)return crunchySeries[1];
        var crunchyMedia=url.match(/[?&]mediaId=([A-Za-z0-9]+)/i);
        if(crunchyMedia)return crunchyMedia[1];
        var standardMatch=url.match(/(?:disneyplus|go\\.disneyplus)\\.com\\/(?:video|movies?|series)\\/(?:[^/]+\\/)?([^/?]+)/i);
        if(standardMatch)return standardMatch[1];
        var guidMatch=url.match(/([a-f0-9-]{36})/i);
        return guidMatch?guidMatch[1]:null;
      }
      function openInBrowserWithUrl(targetUrl){
        if(typeof webOS!=='undefined'&&webOS.service){try{webOS.service.request('luna://com.webos.applicationManager',{method:'launch',parameters:{id:'com.webos.app.browser',params:{url:targetUrl}},onSuccess:function(){},onFailure:function(){}});}catch(e){}}else if(typeof window!=='undefined'&&window.open){window.open(targetUrl,'_blank');}
      }
      function launchApp(appId,fallbackUrl){
        if(!appId||typeof webOS==='undefined'||!webOS.service){if(fallbackUrl)openInBrowserWithUrl(fallbackUrl);return;}
        webOS.service.request('luna://com.webos.applicationManager',{
          method:'launch',
          parameters:{id:appId},
          onSuccess:function(){},
          onFailure:function(){if(fallbackUrl)openInBrowserWithUrl(fallbackUrl);}
        });
      }
      function openStreaming(url,appId){
        if(!url||url==='#')return;
        if(appId){
        var contentId=extractContentId(url);
        var isDisney=appId==='com.disney.disneyplus-prod';
        var launchParams={};
        if(isDisney&&contentId){
          var contentTarget='https://www.disneyplus.com/browse/entity-'+contentId;
          launchParams={
            contentTarget:contentTarget,
            params:{action:'view',target:'player',contentId:contentId},
            query:'contentId='+contentId+'&action=view&target=player'
          };
        }
        var isCrunchyOrMax=appId==='com.crunchyroll.webos'||appId==='com.crunchyroll.crmay'||appId==='com.hbo.hbomax';
        function openInBrowser(){if(typeof webOS!=='undefined'&&webOS.service){try{webOS.service.request('luna://com.webos.applicationManager',{method:'launch',parameters:{id:'com.webos.app.browser',params:{url:url}},onSuccess:function(){},onFailure:function(){}});}catch(e){}}else{window.open(url,'_blank');}}
        function launchWithParams(params){
          var p={id:appId};
          if(params&&Object.keys(params).length){
            p.contentTarget=params.contentTarget;
            p.query=params.query;
            p.params={
              action:params.params&&params.params.action,
              target:params.params&&params.params.target,
              contentId:params.params&&params.params.contentId,
              contentTarget:params.contentTarget,
              query:params.query
            };
          }
          if(typeof webOS!=='undefined'&&webOS.service){
            if(typeof console!=='undefined'&&console.log)console.log('webOS launch params:',JSON.stringify(p));
            webOS.service.request('luna://com.webos.applicationManager',{method:'launch',parameters:p,onSuccess:function(){},onFailure:function(){if(params&&Object.keys(params).length&&isDisney){launchWithParams({})}else if(isCrunchyOrMax){openInBrowser();}}});
          }else if(typeof webOSDev!=='undefined'&&webOSDev&&webOSDev.launch){
            var devParams=p.params||(params&&params.params?params.params:{});
            if(typeof console!=='undefined'&&console.log)console.log('webOSDev launch params:',JSON.stringify({id:appId,params:devParams}));
            webOSDev.launch({id:appId,params:devParams,onSuccess:function(){},onFailure:function(){if(params&&Object.keys(params).length&&isDisney){launchWithParams({})}else if(isCrunchyOrMax){openInBrowser();}}});
          }
        }
        try{launchWithParams(launchParams)}catch(e){if(isDisney){launchWithParams(launchParams)}}
        }else if(typeof webOS!=='undefined'&&webOS.service){
          try{webOS.service.request('luna://com.webos.applicationManager',{method:'launch',parameters:{id:'com.webos.app.browser',params:{url:url}},onSuccess:function(){},onFailure:function(){}});}catch(e){}
        }
        if(!appId&&(!webOS||!webOS.service)){window.open(url,'_blank');}
      }
      document.addEventListener('click',function(e){
        var diagBtn=e.target&&e.target.closest&&e.target.closest('.diag-btn');
        if(diagBtn){
          var diagAppId=diagBtn.getAttribute('data-app-id');
          var diagFallback=diagBtn.getAttribute('data-fallback-url');
          if(diagAppId){e.preventDefault();launchApp(diagAppId,diagFallback||'');return;}
        }
        var el=e.target&&e.target.closest&&e.target.closest('.source-link');
        if(!el||!el.href||el.href==='#')return;
        var url=el.getAttribute('data-url')||el.href,appId=el.getAttribute('data-app-id');
        if(url&&url!=='#'){e.preventDefault();openStreaming(url,appId||'')}
      },true);

      document.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '||e.keyCode===13||e.keyCode===28){
          var el=document.activeElement,srcLink=el&&el.closest&&el.closest('.source-link');
          if(srcLink){
            var url=srcLink.getAttribute('data-url')||srcLink.href,appId=srcLink.getAttribute('data-app-id')||'';
            if(url&&url!=='#'){e.preventDefault();openStreaming(url,appId);return}
          }
          var diagBtn=el&&el.closest&&el.closest('.diag-btn');
          if(diagBtn){
            var diagAppId=diagBtn.getAttribute('data-app-id');
            var diagFallback=diagBtn.getAttribute('data-fallback-url');
            if(diagAppId){e.preventDefault();launchApp(diagAppId,diagFallback||'');return}
          }
          if(el&&el.tagName==='A'&&el.href){el.click();e.preventDefault()}
          return;
        }
        var idx=i(document.activeElement);
        if(idx<0){${tvLogoutModalCheckKeydown}focusFirst();e.preventDefault();return}
        var k=e.key||(e.keyCode===40?'ArrowDown':e.keyCode===38?'ArrowUp':e.keyCode===37?'ArrowLeft':e.keyCode===39?'ArrowRight':'');
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))return;
        e.preventDefault();
        var next=-1;
        if(k==='ArrowRight')next=idx+1;
        else if(k==='ArrowLeft')next=idx-1;
        else if(k==='ArrowDown'){
          if(idx<navCount)next=navCount;
          else if(idx===navCount)next=firstSourceIdx>=0?firstSourceIdx:idx+1;
          else if(idx>=firstSourceIdx&&firstSourceIdx>=0){
            var inGrid=idx+sourceCols;
            next=inGrid<f.length?inGrid:idx;
          }else next=idx+1;
        }else if(k==='ArrowUp'){
          if(idx>=firstSourceIdx&&firstSourceIdx>=0){
            if(idx>=firstSourceIdx+sourceCols)next=idx-sourceCols;
            else next=navCount;
          }else if(idx>navCount)next=idx-1;
          else next=idx>0?idx-1:0;
        }
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
