import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${BASE}/login-standalone`, 302);
    }

    let { data: lists } = await supabase
    .from("lists")
    .select("id, name, is_public, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listIds = (lists ?? []).map((l) => l.id);
  const { data: itemRows } = listIds.length
    ? await supabase.from("list_items").select("list_id").in("list_id", listIds)
    : { data: [] };

  const countByList: Record<string, number> = {};
  for (const row of itemRows ?? []) {
    countByList[row.list_id] = (countByList[row.list_id] ?? 0) + 1;
  }

  const listCards = (lists ?? []).map(
    (list) => `
    <a href="${BASE}/lists-standalone/${list.id}" tabindex="0" class="list-card-link" style="display:block;text-decoration:none;color:inherit;">
      <div class="list-card">
        <p class="list-name">${escapeHtml(list.name)}</p>
        <span class="list-count">${countByList[list.id] ?? 0} títulos</span>
      </div>
    </a>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Mis listas</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px}
    h1{font-size:48px;margin-bottom:28px;color:#e5b00b}
    nav{margin-bottom:36px;display:flex;gap:16px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:16px 24px;border-radius:10px;font-size:22px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none;transition:all 0.2s}
    nav a:hover,nav button:hover,nav a:focus,nav button:focus{background:rgba(99,102,241,0.4);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:3px}
    nav a:nth-child(3){background:#6366f1;border-color:#6366f1}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .list-card-link:focus{outline:none}
    .list-card-link:focus .list-card{transform:scale(1.03);border-color:#e5b00b;box-shadow:0 0 0 3px #e5b00b}
    .list-card{background:rgba(26,26,30,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:24px;min-height:100px;transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s}
    .list-name{font-size:24px;font-weight:600;margin:0 0 8px 0}
    .list-count{font-size:18px;color:#888}
    .empty{color:#888;font-size:22px;padding:40px 0}
  </style>
</head>
<body>
  <h1>Mis listas</h1>
  <nav>
    <a href="${BASE}/tv-standalone" tabindex="0">Inicio</a>
    <a href="${BASE}/search-standalone" tabindex="0">Buscar</a>
    <a href="${BASE}/lists-standalone" tabindex="0">Listas</a>
    <a href="${BASE}/lists-all-standalone" tabindex="0">Ver todo</a>
    <a href="${BASE}/settings-standalone" tabindex="0">Configuración</a>
    <form action="${BASE}/auth/signout" method="POST" style="display:inline">
      <input type="hidden" name="redirect" value="/tv-standalone" />
      <button type="submit" tabindex="0">Cerrar sesión</button>
    </form>
  </nav>
  <div class="grid" id="grid">${listCards || '<p class="empty">Aún no tienes listas. Crea una en tu móvil.</p>'}</div>
  <script>
    (function(){
      var f=document.querySelectorAll('nav a, nav button, .list-card-link');
      function i(el){for(var j=0;j<f.length;j++)if(f[j]===el)return j;return -1}
      f[0]?.focus();
      document.addEventListener('keydown',function(e){
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
        var idx=i(document.activeElement);
        if(idx<0)return;
        e.preventDefault();
        var next=-1,cols=3;
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
  } catch (e) {
    console.error("lists-standalone error:", e);
    const fallback = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Watchily</title></head><body style="background:#0d0d12;color:#fff;font-family:sans-serif;padding:48px"><h1>Error</h1><p>No se pudo cargar. <a href="https://watchily-ho.vercel.app/tv-standalone" style="color:#60a5fa">Volver</a></p></body></html>`;
    return new NextResponse(fallback, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
