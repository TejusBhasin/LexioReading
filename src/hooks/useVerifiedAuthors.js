import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Returns a map of user_email -> { username } for every verified (public) user.
// Verified users' display name is their legal name with spaces replaced by "_".
// Components call this once per mount; verified users are rare (admin-gated).
export default function useVerifiedAuthors() {
  const [map, setMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    base44.entities.UserProfile.filter({ is_verified: true })
      .then((profiles) => {
        if (cancelled) return;
        const m = {};
        (profiles || []).forEach((p) => {
          if (p.is_verified) {
            m[p.user_email] = {
              username: (p.verified_real_name || p.username || '').replace(/ /g, '_'),
            };
          }
        });
        setMap(m);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return map;
}