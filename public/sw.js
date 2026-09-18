const VERSION = 'lexio-v1';
const SHELL_CACHE = `lexio-shell-${VERSION}`;
const ASSET_CACHE = `lexio-assets-${VERSION}`;

// App shell: cached on install so the app loads offline (iOS home-screen PWA).
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(['/', '/manifest.json']);
    } catch (e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // App navigations: network-first; offline → cached app shell (SPA takes over).
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        const cached = (await cache.match('/')) || (await cache.match('/index.html'));
        return cached || Response.error();
      }
    })());
    return;
  }

  // Static assets: cache-first (hashed build files, fonts, covers, logos).
  // Note: only /assets/* gets same-origin cache-first — dev-server modules are
  // served unhashed, so network-first there keeps the builder preview fresh.
  const isAsset =
    (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) ||
    /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp3|mp4)$/i.test(url.pathname) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'media.base44.com' ||
    url.hostname === 'images.unsplash.com';

  if (isAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // Refresh in the background so covers update when back online.
        fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res).catch(() => {});
        }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});
