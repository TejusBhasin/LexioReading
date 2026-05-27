import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useUserSafeness(userEmail) {
  const [safety, setSafety] = useState(null);
  const [blockedPatterns, setBlockedPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }

    Promise.all([
      base44.entities.UserSafeness.filter({ user_email: userEmail }),
      base44.entities.BlockedPattern.filter({ is_active: true }),
    ]).then(([safetyRecs, patterns]) => {
      setSafety(safetyRecs[0] || null);
      setBlockedPatterns(patterns);
    }).catch(() => {
      setSafety(null);
      setBlockedPatterns([]);
    }).finally(() => setLoading(false));
  }, [userEmail]);

  const isEmailBlocked = (email) => {
    if (!email) return false;
    return blockedPatterns
      .filter(p => p.pattern_type === 'email' && p.is_active)
      .some(p => email.toLowerCase().includes(p.pattern.toLowerCase()));
  };

  const isUsernameBlocked = (username) => {
    if (!username) return false;
    return blockedPatterns
      .filter(p => p.pattern_type === 'username' && p.is_active)
      .some(p => username.toLowerCase().includes(p.pattern.toLowerCase()));
  };

  const isBanned = safety?.is_banned === true;
  const isRestrictedFrom = (action) => isBanned || safety?.[`banned_from_${action}`] === true;

  return { safety, loading, isBanned, isRestrictedFrom, isEmailBlocked, isUsernameBlocked };
}