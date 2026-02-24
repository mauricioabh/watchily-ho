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
    body{
      background:linear-gradient(180deg,#0b1120 0%,#080c18 30%,#060810 65%,#05070d 100%);
      color:#fff;font-family:Arial,sans-serif;
      min-height:100vh;
      display:flex;align-items:center;justify-content:center;
      padding:24px
    }
    .card{
      width:100%;max-width:384px;
      background:rgba(26,26,30,0.95);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:12px;
      padding:24px;
      box-shadow:0 4px 24px rgba(0,0,0,0.4)
    }
    .card h1{font-size:24px;font-weight:700;text-align:center;margin-bottom:8px;color:#fff}
    .card .sub{font-size:14px;color:#a1a1aa;text-align:center;margin-bottom:24px}
    .divider{display:flex;align-items:center;margin:20px 0}
    .divider::before,.divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,0.12)}
    .divider span{margin:0 12px;font-size:12px;color:#71717a;text-transform:uppercase}
    form{display:flex;flex-direction:column;gap:16px}
    label{display:block;font-size:14px;color:#a1a1aa;margin-bottom:4px}
    input{
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.2);
      border-radius:8px;
      padding:12px 14px;
      font-size:16px;color:#fff;
      width:100%
    }
    input:focus{outline:2px solid #6366f1;outline-offset:2px}
    .btn{display:block;padding:12px 16px;font-size:16px;font-weight:600;border-radius:8px;cursor:pointer;text-align:center;text-decoration:none;border:none;width:100%}
    .btn-primary{background:#6366f1;color:#fff}
    .btn-outline{background:transparent;border:1px solid rgba(255,255,255,0.2);color:#fff}
    .btn-row{display:flex;gap:8px}
    .btn-row .btn{flex:1}
    .err{color:#f87171;font-size:14px}
    .footer{text-align:center;margin-top:20px;font-size:12px;color:#71717a}
    .footer a{color:#60a5fa;text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <h1>Watchily</h1>
    <p class="sub">Inicia sesión para continuar</p>
    <a href="${BASE}/login" class="btn btn-outline" tabindex="0" title="Abre en tu m&oacute;vil para Google">Continuar con Google (abre en m&oacute;vil)</a>
    <div class="divider"><span>o con email</span></div>
    ${errorParam ? `<p class="err">${escapeHtml(errorParam)}</p>` : ""}
    <form method="POST" action="/api/auth/signin-standalone">
      <input type="hidden" name="redirect" value="/tv-standalone" />
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="tu@email.com" />
      <label for="password">Contraseña</label>
      <input id="password" name="password" type="password" required />
      <div class="btn-row">
        <button type="submit" class="btn btn-primary">Entrar</button>
        <a href="${BASE}/login" class="btn btn-outline" tabindex="0">Registrarse</a>
      </div>
    </form>
    <p class="footer"><a href="${BASE}/">Volver al inicio</a></p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
