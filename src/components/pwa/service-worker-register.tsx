"use client";

import { useEffect, useState } from "react";

function isTvEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  const ua = navigator.userAgent || "";
  if (/webos|web0s|tizen|smarttv|netcast|lg browser/i.test(ua)) return true;
  const { pathname, searchParams } = new URL(window.location.href);
  if (pathname === "/tv" || pathname.startsWith("/tv/")) return true;
  if (pathname.endsWith("-standalone") || pathname.includes("-standalone/"))
    return true;
  if (searchParams.get("device") === "tv") return true;
  return false;
}

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Never run the PWA layer on the TV (content must stay fresh from Vercel).
    if (isTvEnvironment()) return;

    let cancelled = false;
    let onVisible: (() => void) | null = null;

    const promptUpdate = (worker: ServiceWorker | null) => {
      if (worker && !cancelled) setWaitingWorker(worker);
    };

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        if (cancelled) return;

        const activateWaiting = (worker: ServiceWorker | null) => {
          if (!worker) return;
          // Auto-apply so mobile browsers don't stay stuck on old caches.
          worker.postMessage({ type: "SKIP_WAITING" });
          promptUpdate(worker);
        };

        if (registration.waiting && navigator.serviceWorker.controller) {
          activateWaiting(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              activateWaiting(registration.waiting);
            }
          });
        });

        onVisible = () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        };
        document.addEventListener("visibilitychange", onVisible);
        void registration.update();
      })
      .catch(() => undefined);

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      cancelled = true;
      if (onVisible) {
        document.removeEventListener("visibilitychange", onVisible);
      }
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!waitingWorker) return null;

  const applyUpdate = () => {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setWaitingWorker(null);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-100 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-lg backdrop-blur-md">
        <span className="text-sm text-foreground">
          Hay una nueva versión disponible.
        </span>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
