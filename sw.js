// Savings App - Service Worker
// Verhoog CACHE_VERSION elke keer dat je index.html wijzigt
const CACHE_VERSION = 'savings-v5.2';
const CACHE_ASSETS = [
  './',
  './index.html',
];

// Installatie: cache de app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_ASSETS);
    }).then(() => {
      // Activeer meteen zonder te wachten op oude tabs te sluiten
      return self.skipWaiting();
    })
  );
});

// Activatie: verwijder oude caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first strategie voor index.html, cache-first voor de rest
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Externe APIs nooit cachen (Yahoo, Stooq, CoinGecko, etc.)
  if (!url.origin.includes('github.io') && url.origin !== self.location.origin) {
    return;
  }

  // index.html: altijd eerst netwerk proberen (detecteert updates)
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Sla nieuwe versie op in cache
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Overige assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// Luister naar SKIP_WAITING bericht van de app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
