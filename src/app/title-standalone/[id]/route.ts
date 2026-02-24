import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";

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

  const sourceCards = (sources: typeof uniqueSources) =>
    sources
      .map(
        (s) => `
    <a href="${s.url ?? "#"}" target="_blank" rel="noopener noreferrer" tabindex="0" class="source-link">
      <span class="source-name">${escapeHtml(s.providerName)}</span>
      <span class="source-type">${typeLabel(s)}${s.quality ? ` · ${s.quality}` : ""}${s.price != null ? ` · $${s.price}` : ""}</span>
    </a>`
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
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px}
    h1{font-size:48px;margin-bottom:28px;color:#e5b00b}
    nav{margin-bottom:36px;display:flex;gap:16px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:16px 24px;border-radius:10px;font-size:22px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s}
    nav a:hover,nav button:hover,nav a:focus,nav button:focus{background:rgba(99,102,241,0.4);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:3px}
    .hero{display:flex;gap:40px;margin-bottom:40px}
    .poster-wrap{flex-shrink:0;width:280px;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#1f1f23}
    .poster-wrap img{width:100%;height:100%;object-fit:cover}
    .poster-placeholder{display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;font-weight:700;color:#555}
    .info h2{font-size:36px;margin-bottom:12px}
    .meta{font-size:18px;color:#888;margin-bottom:16px}
    .meta span{margin-right:12px}
    .overview{font-size:20px;line-height:1.6;max-width:700px;margin-bottom:24px;color:#ccc}
    .scores{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px}
    .score{display:flex;flex-direction:column;align-items:center;padding:16px 24px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)}
    .score-label{font-size:14px;color:#888}
    .score-value{font-size:24px;font-weight:700;margin-top:4px}
    .trailer-link{display:inline-block;padding:16px 24px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;font-size:20px;margin-bottom:32px}
    .trailer-link:hover,.trailer-link:focus{background:rgba(99,102,241,0.4);outline:3px solid #e5b00b;outline-offset:2px}
    section{margin-bottom:32px}
    section h3{font-size:24px;margin-bottom:16px;color:#e5b00b}
    .sources-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .source-link{display:block;padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s}
    .source-link:hover,.source-link:focus{background:rgba(99,102,241,0.3);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:2px}
    .source-name{display:block;font-size:18px;font-weight:600;margin-bottom:4px}
    .source-type{font-size:14px;color:#888}
  </style>
</head>
<body>
  <h1>${escapeHtml(t.name)}</h1>
  <nav>
    <a href="${BASE}/tv-standalone" tabindex="0">Inicio</a>
    <a href="${BASE}/search-standalone" tabindex="0">Buscar</a>
    <a href="${BASE}/lists-standalone" tabindex="0">Listas</a>
    <a href="${BASE}/lists-all-standalone" tabindex="0">Ver todo</a>
    <a href="${BASE}/settings-standalone" tabindex="0">Configuración</a>
    <a href="${BASE}/tv-standalone" tabindex="0">Volver</a>
    <form action="${BASE}/auth/signout" method="POST" style="display:inline"><input type="hidden" name="redirect" value="/tv-standalone" /><button type="submit" tabindex="0">Cerrar sesión</button></form>
  </nav>
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
      ${t.trailer ? `<a href="${escapeHtml(t.trailer)}" target="_blank" rel="noopener noreferrer" class="trailer-link" tabindex="0">▶ Ver tráiler</a>` : ""}
    </div>
  </div>
  ${subSources.length ? `<section><h3>Disponible con suscripción</h3><div class="sources-grid">${sourceCards(subSources)}</div></section>` : ""}
  ${paidSources.length ? `<section><h3>Alquiler / Compra</h3><div class="sources-grid">${sourceCards(paidSources)}</div></section>` : ""}
  ${uniqueSources.length === 0 ? `<p style="color:#888;font-size:20px">No hay fuentes de streaming disponibles para esta región.</p>` : ""}
  <script>
    (function(){
      var f=document.querySelectorAll('nav a, nav button, .trailer-link, .source-link');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      f[0]?.focus();
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
