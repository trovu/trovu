const CACHE_NAME = "trovu-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/process/index.html",
  "/index.js",
  "/process.js",
  "/data.json",
  "/style.css",
  "/main.js",
  "/manifest.json",
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Only handle top-level page navigations
  if (req.mode === "navigate") {
    // 2) If it's off-origin, open in system browser
    if (url.origin !== self.location.origin) {
      event.respondWith(self.clients.openWindow(req.url));
      return;  // Skip further caching logic for external links
    }
  }

  // 3) All other requests: cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      })
    )
  );
});
