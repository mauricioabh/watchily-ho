import { NextResponse } from "next/server";

/**
 * Proxy para OAuth mobile: Supabase redirige aquí (https) y nosotros
 * redirigimos a la app (exp://) con el code para que haga exchangeCodeForSession.
 * Necesario porque algunos entornos no manejan bien exp:// como redirect directo.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appRedirect = searchParams.get("app_redirect");

  if (!code || !appRedirect) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=missing_params`);
  }

  const separator = appRedirect.includes("?") ? "&" : "?";
  const redirectUrl = `${appRedirect}${separator}code=${encodeURIComponent(code)}`;

  return NextResponse.redirect(redirectUrl);
}
