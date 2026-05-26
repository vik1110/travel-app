const CACHE = 'travel-v20260526';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // HTML → 永遠從網路取，確保內容最新
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 帶版本號的資源（?v=...）→ cache-first
  if (url.search.includes('v=')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // 其餘 → network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
