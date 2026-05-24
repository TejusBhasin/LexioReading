import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 18, readonly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHover(i + 1)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(i + 1)}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
        >
          <Star
            size={size}
            fill={(hover || value) > i ? 'var(--lx-accent)' : 'transparent'}
            style={{ color: 'var(--lx-accent)' }}
          />
        </button>
      ))}
    </div>
  );
}