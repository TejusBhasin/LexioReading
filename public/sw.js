// Self-destructing service worker.
//
// Lexio used to cache its app shell for offline use. On devices that kept an
// older cached copy, sign-in navigations were answered from that stale cache,
// which is what made every sign-in method appear broken. This worker exists
// only to clean a device up: it deletes every cache, removes itself, and stops
// intercepting anything. No fetch handler on purpose.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {}
    try {
      await self.registration.unregister();
    } catch (e) {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});
