// Savings App - Service Worker v5.5
const CACHE_VERSION = 'savings-v5.35';
const CACHE_ASSETS = ['./index.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())  // Activate immediately
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // Take control immediately
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache API calls
  if (!url.pathname.endsWith('.html') && !url.pathname.endsWith('/')) return;

  // Always network-first for HTML - ensures fresh version
  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match('./index.html'))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
