import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://watchily-ho.vercel.app";
const PAIR_URL = `${BASE}/tv/pair`;

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
      width:100%;max-width:420px;
      background:rgba(26,26,30,0.95);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:12px;
      padding:24px;
      box-shadow:0 4px 24px rgba(0,0,0,0.4)
    }
    .card h1{font-size:24px;font-weight:700;text-align:center;margin-bottom:8px;color:#fff}
    .card .sub{font-size:14px;color:#a1a1aa;text-align:center;margin-bottom:20px}
    .pair-section{margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1)}
    .pair-code{font-size:42px;font-weight:700;letter-spacing:0.3em;text-align:center;margin:16px 0;color:#fff;font-family:monospace}
    .pair-url{font-size:13px;color:#60a5fa;text-align:center;word-break:break-all;margin-bottom:8px}
    .pair-hint{font-size:12px;color:#71717a;text-align:center}
    .pair-loading{font-size:14px;color:#a1a1aa;text-align:center;margin:16px 0}
    .divider{text-align:center;color:#71717a;font-size:12px;margin:16px 0}
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
    .err{color:#f87171;font-size:14px}
    .footer{text-align:center;margin-top:16px;font-size:12px;color:#71717a}
    .footer a{color:#60a5fa;text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <h1>Watchily</h1>
    <p class="sub">Vincular con el m&oacute;vil (Google, etc.) o entrar con email</p>
    ${errorParam ? `<p class="err">${escapeHtml(errorParam)}</p>` : ""}

    <div class="pair-section" id="pairSection">
      <p class="sub" style="margin-bottom:8px">1. Abre en tu m&oacute;vil o PC:</p>
      <p class="pair-url">${PAIR_URL}</p>
      <p class="sub" style="margin-bottom:8px">2. Introduce este c&oacute;digo:</p>
      <div class="pair-loading" id="pairLoading">Obteniendo c&oacute;digo…</div>
      <div class="pair-code" id="pairCode" style="display:none"></div>
      <p class="pair-hint" id="pairHint" style="display:none">Esperando que vincules…</p>
    </div>

    <div class="divider">o con email y contrase&ntilde;a</div>

    <form method="POST" action="/api/auth/signin-standalone">
      <input type="hidden" name="redirect" value="/tv-standalone" />
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="tu@email.com" />
      <label for="password">Contrase&ntilde;a</label>
      <input id="password" name="password" type="password" required />
      <button type="submit" class="btn btn-primary">Entrar</button>
    </form>
    <p class="footer" style="margin-top:12px">
      <a href="${BASE}/auth/forgot-password-standalone">¿Usaste Google? Configura contrase&ntilde;a</a>
    </p>
    <p class="footer">
      ¿No tienes cuenta? Cr&eacute;ala en tu m&oacute;vil o computadora en<br/>
      <strong>watchily-ho.vercel.app</strong>
    </p>
  </div>
  <script>
    (function(){
      var loading=document.getElementById("pairLoading");
      var codeEl=document.getElementById("pairCode");
      var hint=document.getElementById("pairHint");
      var codeVal=null;
      var pollTimer=null;

      function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}}

      function doExchange(exchangeToken){
        stopPoll();
        fetch("/api/auth/pair/exchange",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code:codeVal,exchange_token:exchangeToken})
        }).then(function(r){return r.json()}).then(function(d){
          if(d.ok) window.location.href="/tv-standalone";
          else {hint.textContent=d.error||"Error";hint.style.display="block"}
        }).catch(function(){hint.textContent="Error de conexi\u00f3n";hint.style.display="block"});
      }

      function poll(){
        if(!codeVal)return;
        fetch("/api/auth/pair/status?code="+codeVal).then(function(r){return r.json()}).then(function(d){
          if(d.status==="paired"&&d.exchange_token){doExchange(d.exchange_token);return}
          if(d.status==="expired"||d.status==="invalid"){stopPoll();hint.textContent="C\u00f3digo expirado. Recarga la p\u00e1gina.";hint.style.display="block";return}
        });
      }

      fetch("/api/auth/pair/start",{method:"POST"}).then(function(r){return r.json()}).then(function(d){
        loading.style.display="none";
        if(d.code){
          codeVal=d.code;
          codeEl.textContent=d.code;
          codeEl.style.display="block";
          hint.style.display="block";
          pollTimer=setInterval(poll,2000);
          poll();
        }else{
          hint.textContent=d.error||"Error al obtener c\u00f3digo";
          hint.style.display="block";
        }
      }).catch(function(){
        loading.style.display="none";
        hint.textContent="Error de conexi\u00f3n";
        hint.style.display="block";
      });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
