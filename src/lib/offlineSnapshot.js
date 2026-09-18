import { useEffect, useRef } from 'react';
import { base44, seedOfflineData } from '@/api/base44Client';

const HOUR_MS = 60 * 60 * 1000;

// Store every list from a snapshot into the offline cache, so any list
// read that fails while offline can fall back to this data.
export function applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  try {
    Object.entries(snapshot).forEach(([entity, records]) => {
      if (Array.isArray(records)) seedOfflineData(entity, records);
    });
  } catch (e) {}
}

// Gather a fresh snapshot server-side, save it to the OfflineSnapshot
// dataset, and seed the local offline cache with it. If we're already
// offline, fall back to the last synced snapshot record (which the
// offline cache serves without a network).
async function syncNow(user) {
  try {
    const res = await base44.functions.invoke('syncOfflineSnapshot', {});
    if (res.data?.snapshot) {
      applySnapshot(res.data.snapshot);
      return true;
    }
  } catch (e) {}
  try {
    const records = await base44.entities.OfflineSnapshot.filter({ user_email: user.email });
    if (records.length > 0) {
      const parts = records
        .slice()
        .sort((a, b) => (a.part_index || 0) - (b.part_index || 0))
        .map(r => r.snapshot_chunk || '');
      const raw = parts.join('');
      if (raw) {
        applySnapshot(JSON.parse(raw));
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// Hourly server-side snapshot while the app is open, plus an immediate
// sync when connectivity returns and a pull on app open.
export function useOfflineSnapshotSync(user) {
  const timerRef = useRef(null);
  const email = user?.email;

  useEffect(() => {
    if (!email) return;
    syncNow(user);
    timerRef.current = setInterval(() => syncNow(user), HOUR_MS);
    const onOnline = () => syncNow(user);
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('online', onOnline);
    };
  }, [email]);
}