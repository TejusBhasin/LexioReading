import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Offline list cache ────────────────────────────────────────────────────────
// Every entity read (list / filter / get) stores its last successful result
// locally. When the network is unavailable (e.g. iPhone in airplane mode),
// reads fall back to that cached copy, so all lists still render. Writes
// always go to the network and fail normally while offline. The cache is
// cleared on logout so one user's data never leaks to another on a device.
const CACHE_PREFIX = 'lexio_offline_';
const MAX_ENTRY_BYTES = 400000;
const READ_METHODS = new Set(['list', 'filter', 'get']);

export function clearOfflineCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(key, value) {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_ENTRY_BYTES) return;
    localStorage.setItem(CACHE_PREFIX + key, raw);
  } catch (e) {
    // Quota exceeded: drop older cached lists, then retry once.
    try {
      clearOfflineCache();
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
    } catch (e2) {}
  }
}

function wrapEntity(entity, name) {
  return new Proxy(entity, {
    get(target, prop) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, target);
      const value = Reflect.get(target, prop, target);
      if (READ_METHODS.has(prop) && typeof value === 'function') {
        return async (...args) => {
          const key = `${name}:${prop}:${JSON.stringify(args)}`;
          try {
            const result = await value.apply(target, args);
            writeCache(key, result);
            return result;
          } catch (err) {
            const cached = readCache(key);
            if (cached !== null) return cached;
            throw err;
          }
        };
      }
      return value;
    }
  });
}

base44.entities = new Proxy(base44.entities, {
  get(target, prop) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop, target);
    const value = Reflect.get(target, prop, target);
    if (value && typeof value === 'object') return wrapEntity(value, String(prop));
    return value;
  }
});

// Clear cached list data whenever the user logs out.
if (base44.auth && typeof base44.auth.logout === 'function') {
  const realLogout = base44.auth.logout.bind(base44.auth);
  base44.auth.logout = (...args) => {
    clearOfflineCache();
    return realLogout(...args);
  };
}