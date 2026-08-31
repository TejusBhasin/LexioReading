import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 14, className = '' }) {
  return (
    <BadgeCheck
      size={size}
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ color: '#3b82f6' }}
      fill="rgba(59,130,246,0.15)"
      aria-label="Verified"
      title="Verified identity"
    />
  );
}