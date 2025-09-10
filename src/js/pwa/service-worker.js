const CACHE_NAME = "trovu-v1"; // Consider versioning your cache for easier updates
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
  "/favicon-32x32.png",
  // Include additional essential assets as needed
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Implement fetch event to handle requests
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle external URLs (off-origin) - open in system browser
  if (requestUrl.origin !== self.location.origin && event.request.mode === "navigate") {
    event.respondWith(
      self.clients.openWindow(event.request.url).then(() => {
        // Return a response to prevent the PWA from navigating
        return new Response("", {
          status: 204,
          statusText: "External link opened in system browser",
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }),
  );
});
