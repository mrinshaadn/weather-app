const CACHE_NAME = 'climate-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './images/clear.png',
  './images/clouds.png',
  './images/drizzle.png',
  './images/humidity.png',
  './images/mist.png',
  './images/rain.png',
  './images/search.png',
  './images/snow.png',
  './images/wind.png',
  './images/icon-192.png',
  './images/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-first with fallback to cache for robustness, or cache-first for shell)
self.addEventListener('fetch', event => {
  // Only handle GET requests and local/standard resources (ignore API calls to OpenWeatherMap)
  if (event.request.method !== 'GET' || event.request.url.includes('api.openweathermap.org')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to update the cache (stale-while-revalidate pattern)
        fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors offline */});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
