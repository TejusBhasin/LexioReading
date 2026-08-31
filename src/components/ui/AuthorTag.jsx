import React from 'react';
import { Link } from 'react-router-dom';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

// Renders an author's display name as a link to their public profile, with a
// blue verified badge when the author is verified. Verified authors are shown
// by their underscored legal name; others by their snapshot username.
export default function AuthorTag({ email, username, verifiedMap, prefix = '', className = '', style }) {
  const v = verifiedMap?.[email];
  const name = v ? v.username : (username || 'reader');
  return (
    <Link to={`/u/${name}`} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center gap-0.5 ${className}`} style={style}>
      {prefix}{name}
      {v && <VerifiedBadge size={12} />}
    </Link>
  );
}