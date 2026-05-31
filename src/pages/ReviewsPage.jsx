import React, { useState, useEffect } from 'react';
import { Star, Search, Sparkles, BookOpen, TrendingUp, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('recent');

  useEffect(() => {
    loadReviews();
  }, [user]);

  async function loadReviews() {
    setLoading(true);
    try {
      const all = await base44.entities.Review.list('-created_date', 50);
      setReviews(all);
      if (user?.email) {
        setMyReviews(all.filter(r => r.user_email === user.email));
      }
    } catch (e) {}
    setLoading(false);
  }

  const filtered = reviews.filter(r =>
    r.book_title?.toLowerCase().includes(search.toLowerCase()) ||
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.content?.toLowerCase().includes(search.toLowerCase())
  );

  const topRated = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 20);
  const recent = filtered.slice(0, 30);

  const displayed = tab === 'recent' ? recent : tab === 'top' ? topRated : myReviews;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star size={24} style={{ color: 'var(--lx-accent)' }} />
          Community Reviews
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Discover what readers are saying</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Reviews', value: reviews.length },
          { label: 'Avg Rating', value: reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) + ' ★' : '—' },
          { label: 'My Reviews', value: myReviews.length },
        ].map(s => (
          <div key={s.label} className="lx-card p-4 text-center">
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="lx-input pl-9"
          placeholder="Search by book, reviewer, or content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
        {[
          { key: 'recent', label: 'Recent', icon: TrendingUp },
          { key: 'top', label: 'Top Rated', icon: Star },
          ...(user ? [{ key: 'mine', label: 'My Reviews', icon: BookOpen }] : []),
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded transition-all"
            style={{
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--lx-accent)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--lx-shadow-card)' : 'none',
            }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="lx-card p-5 h-24 animate-pulse" />)}
        </div>
      ) : displayed.length > 0 ? (
        <div className="space-y-4">
          {displayed.map(review => (
            <ReviewItem key={review.id} review={review} isOwner={review.user_email === user?.email} onDelete={(id) => {
              setReviews(prev => prev.filter(r => r.id !== id));
              setMyReviews(prev => prev.filter(r => r.id !== id));
            }} />
          ))}
        </div>
      ) : (
        <div className="lx-card p-10 text-center">
          <Star size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {tab === 'mine' ? 'No reviews yet' : 'No reviews found'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {tab === 'mine' ? 'Find a book and share your thoughts!' : 'Be the first to leave a review.'}
          </p>
          <Link to="/discover" className="lx-btn-primary text-sm">Discover Books</Link>
        </div>
      )}

    </div>
  );
}

function ReviewItem({ review, isOwner, onDelete }) {
  const stars = Math.round(review.rating || 0);
  async function handleDelete() {
    if (!confirm('Delete this review?')) return;
    await base44.entities.Review.delete(review.id);
    onDelete?.(review.id);
  }
  return (
    <div className="lx-card p-5 relative">
      {isOwner && (
        <button onClick={handleDelete} className="absolute top-3 right-3 p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} title="Delete review">
          <Trash2 size={13} />
        </button>
      )}
      <div className="flex items-start gap-4">
        {/* Book cover or icon */}
        <div className="flex-shrink-0">
          {review.book_cover ? (
            <img src={review.book_cover} alt={review.book_title} className="w-12 h-16 object-cover rounded" />
          ) : (
            <div className="w-12 h-16 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
              <BookOpen size={16} style={{ color: 'var(--lx-accent)' }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              {review.book_id ? (
                <Link to={`/book/${review.book_id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {review.book_title || 'Unknown Book'}
                </Link>
              ) : (
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{review.book_title || 'Unknown Book'}</span>
              )}
              {review.book_author && (
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>by {review.book_author}</span>
              )}
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill={i < stars ? 'var(--lx-accent)' : 'none'} style={{ color: 'var(--lx-accent)' }} />
              ))}
            </div>
          </div>

          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            by <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>@{review.username || 'reader'}</span>
            {review.created_date && <> · {new Date(review.created_date).toLocaleDateString()}</>}
          </p>

          {review.content && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{review.content}</p>
          )}

          {review.ai_summary && (
            <div className="mt-3 px-3 py-2 rounded text-xs" style={{ background: 'var(--bg-elevated)', borderLeft: '2px solid var(--lx-accent)' }}>
              <span className="flex items-center gap-1 mb-1 font-semibold" style={{ color: 'var(--lx-accent)' }}>
                <Sparkles size={10} /> AI Take
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{review.ai_summary}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}