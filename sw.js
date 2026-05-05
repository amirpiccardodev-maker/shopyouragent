const CACHE = 'sya-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/shop_your_agent.html',
  '/login.html',
  '/offline.html',
  '/sya.js',
  '/manifest.json',
  '/og-image.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/store-assets/screenshot-1.png',
  '/store-assets/screenshot-2.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.addAll(PRECACHE); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('googleapis.com') ||
      url.includes('gstatic.com') || url.includes('jsdelivr.net') ||
      url.includes('stripe.com')) return;

  const isNavigation = e.request.mode === 'navigate';

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return response;
      }).catch(function() {
        if (isNavigation) return caches.match('/offline.html');
        return cached;
      });
    })
  );
});
