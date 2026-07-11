import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
};

let configured = false;

/** Returns true when VAPID keys are present and web-push is ready to send. */
export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:notificaciones@watchily.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
  return true;
}

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Sends a push notification to every subscription belonging to a user.
 * Stale subscriptions (410/404) are pruned automatically.
 * Returns the number of notifications delivered.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) {
    throw new Error("Web Push no está configurado (faltan claves VAPID).");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const subscriptions = (data ?? []) as SubscriptionRow[];
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
  }

  return { sent, removed: staleEndpoints.length };
}
