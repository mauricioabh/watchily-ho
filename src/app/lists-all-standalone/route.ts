import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";
import { filterTitlesByUserProviders } from "@/lib/streaming/providers";
import { tvNavHtml, tvNavCss, tvTileCss } from "@/lib/tv-shared";

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
  const validTitles = titles.filter((t): t is NonNullable<typeof t> => t != null);
  const filtered = filterTitlesByUserProviders(validTitles, userProviderIds);

  const tileHtml = (t: typeof filtered[0]) => {
    const platform = t.sources?.[0]?.providerName ?? "";
    return `<a href="${BASE}/title-standalone/${t.id}" tabindex="0" class="tile-link">
      <div class="tile">
        <div class="tile-poster">
          ${t.poster?.startsWith("http") ? `<img src="${t.poster}" alt="${escapeHtml(t.name)}" loading="lazy" />` : `<div class="tile-placeholder">${escapeHtml(t.name.slice(0,2))}</div>`}
          <span class="tile-badge">${t.type === "series" ? "SERIE" : "PELÍCULA"}</span>
          ${platform ? `<span class="tile-platform">${escapeHtml(platform)}</span>` : ""}
        </div>
        <div class="tile-info">
          <p class="tile-title">${escapeHtml(t.name)}</p>
          ${t.year ? `<span class="tile-year">${t.year}</span>` : ""}
        </div>
      </div>
    </a>`;
  };

  const tiles = filtered.map(tileHtml).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Ver todo</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:0}
    .page{padding:32px 48px 48px}
    ${tvNavCss}
    ${tvTileCss}
  </style>
</head>
<body>
  ${tvNavHtml(BASE, "vertodo", "vertodo")}
  <main class="page">
  <h1 style="font-size:36px;color:#e5b00b;margin-bottom:24px">Ver todo</h1>
  <div class="grid" id="grid">${tiles}</div>
  </main>
  <script>
    (function(){
      var f=document.querySelectorAll('.tv-nav a, .tv-nav button, .tile-link');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      document.getElementById('firstFocus')?.focus();
      document.addEventListener('keydown',function(e){
        var idx=i(document.activeElement);
        if(idx<0){document.getElementById('firstFocus')?.focus();e.preventDefault();return;}
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();
        var next=-1,navCount=6,cols=5;
        if(e.key==='ArrowRight')next=idx+1;
        else if(e.key==='ArrowLeft')next=idx-1;
        else if(e.key==='ArrowDown'){
          if(idx<navCount)next=navCount+(idx%cols);
          else next=idx+cols;
        }else if(e.key==='ArrowUp'){
          if(idx>=navCount)next=(idx-navCount)%cols;
          else next=idx-cols;
        }
        if(next>=0&&next<f.length)f[next].focus();
      },true);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
