const CACHE_NAME = "trust-office-shell-__BUILD_HASH__";
const CORE_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/fonts/fonts.css",
  "/fonts/Galmuri9.woff2",
  "/fonts/Galmuri11.woff2",
  "/fonts/Galmuri14.woff2",
  "/fonts/PressStart2P.woff2",
];

self.addEventListener("install", (event) => {
  const freshRequests = CORE_FILES.map((url) => new Request(url, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(freshRequests)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname === "/sw.js") {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html"))),
  );
});
