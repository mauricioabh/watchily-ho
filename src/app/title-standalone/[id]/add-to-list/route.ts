import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTitleDetails } from "@/lib/streaming/unified";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const title = await getTitleDetails(titleId);
  const titleType = title?.type ?? "movie";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(`${BASE}/login-standalone`, 302);

  const { data: lists } = await supabase
    .from("lists")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: items } = await supabase
    .from("list_items")
    .select("list_id")
    .eq("title_id", titleId);

  const listIds = new Set((items ?? []).map((i) => i.list_id));

  const listRows = (lists ?? []).map((list) => {
    const inList = listIds.has(list.id);
    return { ...list, inList };
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Añadir a lista</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px}
    h1{font-size:48px;margin-bottom:28px;color:#e5b00b}
    nav{margin-bottom:36px;display:flex;gap:16px;flex-wrap:wrap}
    nav a,nav button{display:inline-block;padding:16px 24px;border-radius:10px;font-size:22px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;text-decoration:none}
    nav a:hover,nav button:hover,nav a:focus,nav button:focus{background:rgba(99,102,241,0.4);outline:3px solid #e5b00b}
    .list-row{display:flex;align-items:center;justify-content:space-between;padding:24px;margin-bottom:16px;background:rgba(26,26,30,0.95);border-radius:12px;border:1px solid rgba(255,255,255,0.12)}
    .list-name{font-size:28px;font-weight:600}
    .list-row button,.list-row a{padding:12px 24px;border-radius:8px;font-size:20px;cursor:pointer;border:none;text-decoration:none;display:inline-block}
    .btn-add{background:#6366f1;color:#fff}
    .btn-remove{background:#ef4444;color:#fff}
    .btn-back{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)}
    .create-hint{font-size:24px;color:#888;margin-top:32px}
    .create-hint a{color:#60a5fa;text-decoration:underline}
  </style>
</head>
<body>
  <h1>Añadir a lista</h1>
  <nav>
    <a href="${BASE}/title-standalone/${titleId}" tabindex="0" class="btn-back">← Volver</a>
    <a href="${BASE}/tv-standalone" tabindex="0">Inicio</a>
  </nav>
  <div style="margin-top:32px">
    ${listRows.map((l) => l.inList
      ? `<div class="list-row"><span class="list-name">${escapeHtml(l.name)}</span><form method="POST" action="${BASE}/api/tv/remove-from-list" style="display:inline"><input type="hidden" name="list_id" value="${l.id}" /><input type="hidden" name="title_id" value="${titleId}" /><input type="hidden" name="redirect" value="${BASE}/title-standalone/${titleId}/add-to-list" /><button type="submit" tabindex="0" class="btn-remove">Quitar</button></form></div>`
      : `<div class="list-row"><span class="list-name">${escapeHtml(l.name)}</span><form method="POST" action="${BASE}/api/tv/add-to-list" style="display:inline"><input type="hidden" name="list_id" value="${l.id}" /><input type="hidden" name="title_id" value="${titleId}" /><input type="hidden" name="title_type" value="${titleType}" /><input type="hidden" name="redirect" value="${BASE}/title-standalone/${titleId}/add-to-list" /><button type="submit" tabindex="0" class="btn-add">Añadir</button></form></div>`
    ).join("")}
  </div>
  ${listRows.length === 0 ? "<p class='create-hint'>No tienes listas. <a href='" + BASE + "/lists'>Crea una en la web</a></p>" : ""}
  <p class="create-hint">Para crear listas nuevas, usa la <a href="${BASE}/lists">web</a> o la app móvil.</p>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
