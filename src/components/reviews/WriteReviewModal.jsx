import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { awardPoints } from '@/lib/points';

export default function WriteReviewModal({ book, username, userEmail, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!rating || content.trim().length < 30) return;
    setSubmitting(true);
    try {
      await base44.entities.Review.create({
        user_email: userEmail,
        username,
        book_id: book.google_books_id || book.id,
        book_title: book.title,
        book_author: book.author,
        book_cover: book.cover_image,
        rating,
        content: content.trim(),
        has_spoilers: hasSpoilers,
        is_public: isPublic,
        approved: true,
      });
      await awardPoints(userEmail, 'review', username);
      // Trigger AI analysis to update taste profile and reading strength (fire-and-forget)
      base44.functions.invoke('analyzeUserActivity', {
        user_email: userEmail,
        activity_type: 'review',
        content: content.trim(),
        book_title: book.title,
        book_author: book.author,
        rating,
      }).catch(() => {});
      onSubmitted();
    } catch (e) {}
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Review: {book.title}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i + 1)}>
              <Star size={24}
                fill={(hover || rating) > i ? 'var(--lx-accent)' : 'transparent'}
                style={{ color: 'var(--lx-accent)' }} />
            </button>
          ))}
        </div>

        <textarea
          className="lx-input mb-3 resize-none"
          rows={5}
          placeholder="Share your thoughts... (min 30 characters)"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={800}
        />
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{content.length}/800</p>

        <label className="flex items-center gap-2 cursor-pointer mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={hasSpoilers} onChange={e => setHasSpoilers(e.target.checked)}
            className="rounded" />
          This review contains spoilers
        </label>

        <label className="flex items-center gap-2 cursor-pointer mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
            className="rounded" />
          Show on public reviews page
        </label>

        <div className="flex gap-2">
          <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={submit} disabled={!rating || content.length < 30 || submitting}
            className="lx-btn-primary flex-1 justify-center">
            {submitting ? 'Submitting...' : 'Post Review'}
          </button>
        </div>
      </div>
    </div>
  );
}