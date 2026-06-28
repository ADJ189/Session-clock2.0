// Session Clock Service Worker
// Strategy:
//   - Same-origin HTML (/, /index.html): network-first, cache fallback
//   - Same-origin hashed assets (*.js, *.css): cache-first (Vite content-hashes)
//   - External origins (fonts, weather API, geocoding): network-only, never cached
//     Reason: opaque cross-origin responses consume disproportionate storage quota
//     (browsers reserve up to 7MB per opaque entry) and can permanently cache errors.

const CACHE = 'session-clock-v2';

// Only precache the bare minimum — everything else is populated on demand
const PRECACHE = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // External origins: always network-only (no opaque caching)
  if (url.origin !== self.location.origin) {
    return; // fall through to browser default (network)
  }

  // Hashed assets (Vite appends a content hash): cache-first, very long TTL
  if (/\.(?:js|css|woff2?|svg|png|webp|ico)$/.test(url.pathname) &&
      // Only cache-first when the asset has a Vite content hash in the name
      // (pattern: filename-[8hexchars].ext) to avoid caching unhashed files
      /[-_][0-9a-f]{8,}\.\w+$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // HTML navigation + everything else: network-first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
