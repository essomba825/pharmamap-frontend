const VERSION = "v2";
const SHELL_CACHE = `pharmamap-shell-${VERSION}`;
const ASSET_CACHE = `pharmamap-assets-${VERSION}`;
const DATA_CACHE = `pharmamap-data-${VERSION}`;

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/pharmamap-logo.svg",
  "/icons/icon.svg",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, ASSET_CACHE, DATA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, "/index.html"));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(networkFirst(request, DATA_CACHE));
      return;
    }

    if (url.pathname.startsWith("/media/")) {
      event.respondWith(cacheFirst(request, ASSET_CACHE));
      return;
    }

    if (url.pathname.match(/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2|woff|ttf|eot)$/)) {
      event.respondWith(cacheFirst(request, ASSET_CACHE));
      return;
    }
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}
