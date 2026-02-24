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
    <a href="${BASE}/lists-standalone/${list.id}" tabindex="0" class="focusable" style="display:block;text-decoration:none;color:inherit;">
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;min-height:80px;">
        <p style="font-size:18px;font-weight:600;margin:0 0 4px 0;">${escapeHtml(list.name)}</p>
        <span style="font-size:14px;color:#888;">${countByList[list.id] ?? 0} títulos</span>
      </div>
    </a>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Mis listas</title>
  <script src="https://cdn.jsdelivr.net/npm/js-spatial-navigation@1.0.1/spatial_navigation.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:40px}
    h1{font-size:42px;margin-bottom:24px;color:#e5b00b}
    nav{margin-bottom:32px;display:flex;gap:12px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:12px 20px;border-radius:8px;font-size:16px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none}
    nav a:first-child{background:#6366f1;border-color:#6366f1}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    a:focus,button:focus{outline:3px solid #e5b00b;outline-offset:4px}
    .grid a:focus>div{border-color:#e5b00b!important;box-shadow:0 0 0 2px #e5b00b}
    .empty{color:#888;font-size:18px;padding:40px 0}
  </style>
</head>
<body>
  <h1>Mis listas</h1>
  <nav id="nav">
    <a href="${BASE}/tv-standalone" tabindex="0" class="focusable">Inicio</a>
    <a href="${BASE}/search?device=tv" tabindex="0" class="focusable">Buscar</a>
    <a href="${BASE}/lists-standalone" tabindex="0" class="focusable">Listas</a>
    <a href="${BASE}/lists-all-standalone" tabindex="0" class="focusable">Ver todo</a>
    <form action="${BASE}/auth/signout" method="POST" style="display:inline">
      <input type="hidden" name="redirect" value="/login-standalone" />
      <button type="submit" tabindex="0" class="focusable">Cerrar sesión</button>
    </form>
  </nav>
  <div class="grid" id="grid">${listCards || '<p class="empty">Aún no tienes listas. Crea una en tu móvil.</p>'}</div>
  <script>
    (function(){
      if(typeof SpatialNavigation==="undefined"){setTimeout(function(){var f=document.querySelector("a");if(f)f.focus()},100);return}
      SpatialNavigation.init();
      SpatialNavigation.add("main",{selector:"#nav a, #nav button, .grid a"});
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
}
