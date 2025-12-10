
const CACHE_NAME = 'brigade-manager-v3';
const DYNAMIC_CACHE = 'brigade-dynamic-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800&display=swap'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for API/CDN, Cache First for Static, Fallback for Offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle CDN requests (React, Lucide, Google Fonts, Tailwind, Flaticon icons)
  if (
    url.origin === 'https://aistudiocdn.com' || 
    url.origin === 'https://fonts.gstatic.com' || 
    url.origin === 'https://cdn.tailwindcss.com' ||
    url.origin === 'https://cdn-icons-png.flaticon.com'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
           return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            // Return nothing or a placeholder if offline and not in cache
            // For images we could return a placeholder
        });
      })
    );
    return;
  }

  // General Strategy: Stale-While-Revalidate for local files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
          // Fallback if offline
      });
      return cachedResponse || fetchPromise;
    })
  );
});