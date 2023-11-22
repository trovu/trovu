const CACHE_NAME = 'trovu';
const urlsToCache = [
  '/',
  '/index.html',
  '/process/index.html',
  '/includes/yourscript.js',
  '/data.json'
  // Add other assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Implement fetch event to handle requests
