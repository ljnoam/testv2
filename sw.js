// Service Worker PWA - Offline First Strategy

const CACHE_NAME = 'myfinance-v2'; // Increment to force update
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other local assets if any
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // 1. Ignore Firestore Requests (Handled by Firebase SDK + Our LocalDB Logic)
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebase')) {
    return;
  }

  // 2. Navigation Requests (HTML) - Network First, fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, Images) - Stale-While-Revalidate
  // This allows offline use while keeping assets fresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache with new version
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
             });
        }
        return networkResponse;
      }).catch(() => {
         // Network failed, nothing to do, return undefined to let the cachedResponse handle it
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for skipWaiting message (for auto-update UI)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});