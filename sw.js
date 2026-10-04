const CACHE_NAME = 'sand-cone-fdt-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache each file independently: one failed fetch (e.g. a flaky
      // connection) should never block the rest of the app from being
      // precached for offline use.
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(function(url) {
          return fetch(url, { mode: url.indexOf('http') === 0 ? 'cors' : 'same-origin' })
            .then(function(response) {
              if (response && (response.ok || response.type === 'opaque')) {
                return cache.put(url, response);
              }
            })
            .catch(function() { /* skip this one, keep going */ });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then(function(networkResponse) {
          return caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(function() {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
