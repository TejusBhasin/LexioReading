import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Returns a map of user_email -> { username } for every verified (public) user.
// Verified users' display name is their legal name with spaces replaced by "_".
// Components call this once per mount; verified users are rare (admin-gated).
export default function useVerifiedAuthors() {
  const [map, setMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    // Two sources of verification: Didit-approved (UserProfile.is_verified) and
    // admin-granted (VerifiedUser records). Merge both into one email -> {username} map.
    Promise.all([
      base44.entities.UserProfile.filter({ is_verified: true }).catch(() => []),
      base44.entities.VerifiedUser.list('-created_date', 200).catch(() => []),
    ]).then(([profiles, manual]) => {
      if (cancelled) return;
      const m = {};
      (profiles || []).forEach((p) => {
        if (p.is_verified) {
          m[p.user_email] = {
            username: (p.verified_real_name || p.username || '').replace(/ /g, '_'),
          };
        }
      });
      (manual || []).forEach((v) => {
        if (!m[v.user_email]) {
          m[v.user_email] = { username: v.username || (v.user_email || '').split('@')[0] };
        }
      });
      setMap(m);
    });
    return () => { cancelled = true; };
  }, []);
  return map;
}