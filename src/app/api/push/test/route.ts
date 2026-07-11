import { createClient } from "@/lib/supabase/server";
import { isPushConfigured, sendPushToUser } from "@/lib/push/web-push";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return Response.json(
      { error: "Web Push no está configurado en el servidor." },
      { status: 503 },
    );
  }

  try {
    const result = await sendPushToUser(user.id, {
      title: "Watchily",
      body: "Las notificaciones están activadas. ¡Listo!",
      url: "/popular",
      tag: "watchily-test",
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
