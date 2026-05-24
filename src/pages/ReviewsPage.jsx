import React, { useState, useEffect } from 'react';
import { Star, PenSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ReviewCard from '@/components/reviews/ReviewCard';

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await base44.entities.Review.list('-created_date', 30);
      setReviews(r);
    } catch (e) {}
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star size={22} style={{ color: 'var(--lx-accent)' }} />
          Community Reviews
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg" style={{ background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star size={36} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id}>
              <p className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                {r.book_title} · {r.book_author}
              </p>
              <ReviewCard review={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}