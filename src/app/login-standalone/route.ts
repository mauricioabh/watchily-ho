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
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d0d12;color:#fff;font-family:Arial,sans-serif;min-height:100vh;padding:48px}
    h1{font-size:42px;color:#e5b00b;margin-bottom:16px}
    p{margin-bottom:16px;color:#aaa;font-size:20px}
    form{max-width:400px;margin-top:24px}
    label{display:block;font-size:16px;color:#888;margin-bottom:12px}
    input{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;font-size:18px;color:#fff;width:100%;margin-bottom:16px}
    button{background:#6366f1;color:#fff;border:none;padding:16px 24px;font-size:18px;font-weight:600;border-radius:8px;cursor:pointer;width:100%}
    .err{color:#f87171;margin-bottom:16px}
    a{color:#60a5fa;font-size:18px}
  </style>
</head>
<body>
  <h1>Watchily</h1>
  <p>Inicia sesión para ver tus listas y contenido personalizado</p>
  ${errorParam ? `<p class="err">${escapeHtml(errorParam)}</p>` : ""}
  <form method="POST" action="/api/auth/signin-standalone">
    <input type="hidden" name="redirect" value="/tv-standalone" />
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required placeholder="tu@email.com" />
    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password" required />
    <button type="submit">Entrar</button>
  </form>
  <p style="margin-top:32px">O inicia sesión en tu m&oacute;vil en <a href="${BASE}/login">watchily-ho.vercel.app/login</a></p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
