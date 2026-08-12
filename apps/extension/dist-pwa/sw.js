/** My Pings PWA service worker — network-first for app shell & assets. */
const CACHE = 'my-pings-pwa-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCacheableResponse(request, response) {
  if (!response || !response.ok) return false;
  if (!request.url.startsWith(self.location.origin)) return false;
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (request.destination === 'style' || request.url.endsWith('.css')) {
    return ct.includes('text/css');
  }
  if (request.destination === 'script' || request.url.endsWith('.js')) {
    return ct.includes('javascript') || ct.includes('ecmascript');
  }
  if (request.mode === 'navigate' || request.destination === 'document') {
    return ct.includes('text/html');
  }
  // Avoid caching SPA HTML fallbacks for missing static files.
  if (ct.includes('text/html') && !request.url.endsWith('/') && !request.url.endsWith('.html')) {
    return false;
  }
  return true;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(event.request);
        if (isCacheableResponse(event.request, network)) {
          const copy = network.clone();
          void caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return network;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return Response.error();
      }
    })()
  );
});
