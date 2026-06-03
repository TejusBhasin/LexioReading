import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, AlertTriangle, Eye } from 'lucide-react';

export default function ReviewCard({ review }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const displayName = review.username || review.user_email?.split('@')[0];

  return (
    <div className="lx-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {displayName?.[0]?.toUpperCase() || '?'}
          </div>
          {review.username ? (
            <Link to={`/u/${review.username}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
              @{review.username}
            </Link>
          ) : (
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayName}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12}
              fill={i < review.rating ? 'var(--lx-accent)' : 'transparent'}
              style={{ color: 'var(--lx-accent)' }} />
          ))}
        </div>
      </div>

      {review.has_spoilers && !spoilerRevealed ? (
        <div className="rounded-lg p-3 flex items-center justify-between"
          style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--lx-accent)' }}>
            <AlertTriangle size={14} /> Contains spoilers
          </div>
          <button onClick={() => setSpoilerRevealed(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            <Eye size={11} /> Reveal
          </button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {review.content}
        </p>
      )}

      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {review.tags.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {new Date(review.created_date).toLocaleDateString()}
      </p>
    </div>
  );
}