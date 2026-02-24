import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return NextResponse.redirect(`${BASE}/tv-standalone`, 302);
  }

  const errorParam = new URL(request.url).searchParams.get("error");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Watchily - Iniciar sesión</title>
  <script src="https://cdn.jsdelivr.net/npm/js-spatial-navigation@1.0.1/spatial_navigation.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:40px;display:flex;align-items:center;justify-content:center}
    .card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;max-width:420px;width:100%}
    h1{font-size:36px;color:#e5b00b;margin-bottom:8px}
    .sub{margin-bottom:24px;color:#888;font-size:18px}
    form{display:flex;flex-direction:column;gap:16px}
    label{font-size:14px;color:#aaa}
    input{background:#1a1a1a;border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:14px 16px;font-size:18px;color:#fff}
    input:focus{outline:3px solid #e5b00b;outline-offset:2px}
    button,a.btn{display:inline-block;padding:14px 24px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;border:none}
    .primary{background:#6366f1;color:#fff}
    .secondary{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)}
    a:focus,button:focus{outline:3px solid #e5b00b;outline-offset:4px}
    .msg{font-size:14px;padding:8px 0}
    .err{color:#f87171}
    .ok{color:#4ade80}
  </style>
</head>
<body>
  <div class="card">
    <h1>Watchily</h1>
    <p class="sub">Inicia sesión para ver tus listas y contenido personalizado</p>
    ${errorParam ? `<p class="msg err">${escapeHtml(errorParam)}</p>` : ""}
    <form method="POST" action="/api/auth/signin-standalone">
      <input type="hidden" name="redirect" value="/tv-standalone" />
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="tu@email.com" tabindex="0" />
      <label for="password">Contraseña</label>
      <input id="password" name="password" type="password" required tabindex="0" />
      <button type="submit" class="primary" tabindex="0">Entrar</button>
    </form>
    <p style="margin-top:20px;text-align:center;color:#666;font-size:14px">
      O inicia sesión en tu m&oacute;vil en<br/>
      <a href="${BASE}/login" style="color:#60a5fa" tabindex="0">watchily-ho.vercel.app/login</a>
    </p>
  </div>
  <script>
    (function(){
      if(typeof SpatialNavigation==="undefined")return;
      SpatialNavigation.init();
      SpatialNavigation.add("main",{selector:"input, button, a"});
      SpatialNavigation.makeFocusable();
      SpatialNavigation.focus();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
