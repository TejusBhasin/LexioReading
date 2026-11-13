// Recovers a device whose browser keeps answering sign-in requests with a
// stale cached copy of the app (an old service worker or cached assets).
// Unregisters every service worker, empties the caches, then reloads.
export async function repairSignInOnThisDevice() {
  try {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {}
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {}
  window.location.replace(window.location.pathname);
}