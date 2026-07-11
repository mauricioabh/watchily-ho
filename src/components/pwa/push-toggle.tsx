"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

type Status = "loading" | "unsupported" | "unconfigured" | "off" | "on";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus("unconfigured");
      return;
    }
    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        setStatus(existing ? "on" : "off");
      } catch {
        setStatus("off");
      }
    })();
  }, [supported]);

  const enable = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permiso de notificaciones denegado.");
        setBusy(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("No se pudo guardar la suscripción.");
      setStatus("on");
      setMessage("Notificaciones activadas.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al activar.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
      setMessage("Notificaciones desactivadas.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al desactivar.");
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
      };
      if (!res.ok)
        throw new Error(data.error || "No se pudo enviar la prueba.");
      setMessage(
        data.sent && data.sent > 0
          ? "Notificación de prueba enviada."
          : "No hay dispositivos suscritos.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al enviar.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (status === "loading") return null;

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <Label>Notificaciones</Label>

      {status === "unsupported" && (
        <p className="text-sm text-muted-foreground">
          Tu navegador no soporta notificaciones push.
        </p>
      )}

      {status === "unconfigured" && (
        <p className="text-sm text-muted-foreground">
          Las notificaciones push no están configuradas en el servidor.
        </p>
      )}

      {(status === "on" || status === "off") && (
        <>
          <p className="text-sm text-muted-foreground">
            Recibe avisos sobre novedades y disponibilidad de tus títulos en
            este dispositivo.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {status === "off" ? (
              <Button onClick={enable} disabled={busy}>
                <Bell className="size-4" />
                {busy ? "Activando…" : "Activar notificaciones"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={disable} disabled={busy}>
                  <BellOff className="size-4" />
                  {busy ? "Desactivando…" : "Desactivar"}
                </Button>
                <Button variant="ghost" onClick={sendTest} disabled={busy}>
                  Enviar prueba
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
