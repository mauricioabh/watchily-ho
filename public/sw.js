/*
 * Watchily service worker (PWA).
 * Custom SW (no build-tool coupling) so it works with Next 16 + Turbopack.
 *
 * Strategy overview:
 *  - Navigations: network-first, fall back to cache, then the offline page.
 *  - Next static assets / fonts: cache-first (content-hashed, immutable).
 *  - Remote poster images: stale-while-revalidate (capped).
 *  - API GET: network-first with a cache fallback (basic offline data).
 *  - TV / *-standalone routes are never handled (always fresh from network).
 *  - Web Push: show notifications + focus/open the app on click.
 */

const VERSION = "v2";
const SHELL_CACHE = `watchily-shell-${VERSION}`;
const STATIC_CACHE = `watchily-static-${VERSION}`;
const IMAGE_CACHE = `watchily-images-${VERSION}`;
const API_CACHE = `watchily-api-${VERSION}`;

const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/192", "/icons/512"];

const IMAGE_CACHE_LIMIT = 120;
const API_CACHE_LIMIT = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE, API_CACHE]);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isTvOrStandalone(url) {
  return (
    url.pathname === "/tv" ||
    url.pathname.startsWith("/tv/") ||
    url.pathname.endsWith("-standalone") ||
    url.pathname.includes("-standalone/") ||
    url.searchParams.get("device") === "tv"
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-icon" ||
    /\.(?:css|js|woff2?|ttf|otf)$/.test(url.pathname)
  );
}

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  return /\.(?:png|jpg|jpeg|gif|webp|svg|avif)$/.test(url.pathname);
}

function isCacheableApi(url) {
  if (!url.pathname.startsWith("/api/")) return false;
  // Never cache auth, push, realtime or webhook endpoints.
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/push/") ||
    url.pathname.startsWith("/api/inngest") ||
    url.pathname.startsWith("/api/tv/")
  ) {
    return false;
  }
  return true;
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (let i = 0; i < keys.length - limit; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(cacheName, limit);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(API_CACHE, API_CACHE_LIMIT);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin, except remote poster images we want to cache.
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && isTvOrStandalone(url)) return; // always fresh from network

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (sameOrigin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(
      staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT),
    );
    return;
  }

  if (sameOrigin && isCacheableApi(url)) {
    event.respondWith(networkFirstApi(request));
    return;
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Watchily";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/192",
    badge: payload.badge || "/icons/192",
    data: { url: payload.url || "/" },
    tag: payload.tag,
    renotify: Boolean(payload.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })(),
  );
});
