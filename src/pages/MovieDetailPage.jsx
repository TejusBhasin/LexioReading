import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Plus, BookmarkCheck, Clock, Film, X, PenSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getMovieDetails } from '@/lib/tmdb';
import ReviewCard from '@/components/reviews/ReviewCard';
import MovieWatchlistControls from '@/components/movies/MovieWatchlistControls';

export default function MovieDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const movieId = window.location.pathname.split('/').pop();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [libEntry, setLibEntry] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', has_spoilers: false });
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    getMovieDetails(movieId)
      .then((m) => {
        setMovie(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [movieId]);

  useEffect(() => {
    if (user?.email && movieId) {
      base44.entities.UserLibrary.filter({ user_email: user.email, book_id: movieId, media_type: 'movie' })
        .then((r) => { setLibEntry(r[0] || null); if (r[0]) setNotes(r[0].notes || ''); })
        .catch(() => {});
    }
  }, [user, movieId]);

  useEffect(() => {
    if (movieId) {
      base44.entities.Review.filter({ book_id: movieId, media_type: 'movie' }, '-created_date', 20)
        .then(setReviews)
        .catch(() => setReviews([]));
    }
  }, [movieId]);

  async function submitReview() {
    if (!user) { window.location.href = '/login'; return; }
    if (!reviewForm.content.trim()) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.Review.create({
        user_email: user.email,
        username: user.full_name || user.email.split('@')[0],
        book_id: movieId,
        book_title: movie.title,
        book_author: movie.director || '',
        book_cover: movie.cover_image,
        media_type: 'movie',
        rating: reviewForm.rating,
        content: reviewForm.content.trim(),
        has_spoilers: reviewForm.has_spoilers,
        is_public: true,
      });
      setReviews((prev) => [created, ...prev]);
      setReviewForm({ rating: 5, content: '', has_spoilers: false });
      setShowReviewForm(false);
    } catch (e) {}
    setSubmitting(false);
  }

  async function saveNotes() {
    if (!user) { window.location.href = '/login'; return; }
    try {
      if (libEntry?.id) {
        await base44.entities.UserLibrary.update(libEntry.id, { notes });
      } else {
        const entry = await base44.entities.UserLibrary.create({
          user_email: user.email, book_id: movieId, book_title: movie.title,
          book_author: movie.director || '', book_cover: movie.cover_image,
          media_type: 'movie', status: 'want_to_read', notes, date_added: new Date().toISOString(),
        });
        setLibEntry(entry);
      }
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (e) {}
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Film size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Movie not found.</p>
        <Link to="/discover" className="inline-block mt-4 lx-btn-primary text-sm">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Backdrop */}
      {movie.backdrop_image && (
        <div className="relative w-full rounded-xl overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
          <img src={movie.backdrop_image} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent 60%)' }} />
        </div>
      )}

      <div className="flex gap-5 mb-6">
        {/* Poster with red play button (links to trailer) */}
        <div className="flex-shrink-0 w-28 sm:w-36">
          <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '2/3' }}>
            {movie.cover_image ? (
              <img src={movie.cover_image} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <Film size={28} style={{ color: 'var(--lx-accent)' }} />
              </div>
            )}
            {movie.trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#e50914', boxShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                  <Play size={22} fill="white" style={{ color: 'white', marginLeft: 3 }} />
                </div>
              </a>
            )}
            {!movie.trailer && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#e50914', boxShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                  <Play size={22} fill="white" style={{ color: 'white', marginLeft: 3 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{movie.title}</h1>
          {movie.tagline && <p className="text-sm italic mb-2" style={{ color: 'var(--text-muted)' }}>{movie.tagline}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {movie.release_year && <span>{movie.release_year}</span>}
            {movie.runtime > 0 && (
              <span className="flex items-center gap-1"><Clock size={12} /> {movie.runtime}m</span>
            )}
            {movie.average_rating > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#e8c547' }}>
                <Star size={12} fill="currentColor" /> {movie.average_rating}/10
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({movie.ratings_count})</span>
              </span>
            )}
          </div>
          {movie.director && <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Directed by {movie.director}</p>}
          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {movie.genres.map((g) => (
                <span key={g} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{g}</span>
              ))}
            </div>
          )}

          <MovieWatchlistControls user={user} movie={movie} movieId={movieId} libEntry={libEntry} onChanged={setLibEntry} />
        </div>
      </div>

      {/* Overview */}
      {movie.description && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Overview</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{movie.description}</p>
        </div>
      )}

      {isAuthenticated && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <PenSquare size={16} style={{ color: 'var(--lx-accent)' }} /> My Notes
          </h2>
          <textarea
            className="lx-input resize-none text-sm"
            rows={3}
            placeholder="Private notes or thoughts about this movie..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button onClick={saveNotes} className="lx-btn-ghost text-xs py-1.5 mt-2">
            {noteSaved ? '✓ Saved' : 'Save Notes'}
          </button>
        </div>
      )}

      {/* Cast */}
      {movie.cast?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Cast</h2>
          <div className="flex flex-wrap gap-2">
            {movie.cast.map((c, i) => (
              <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                {c.character && <span style={{ color: 'var(--text-muted)' }}> · {c.character}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TMDB Reviews */}
      {movie.reviews?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Critic & Audience Reviews (TMDB)</h2>
          <div className="space-y-3">
            {movie.reviews.map((r, i) => (
              <div key={i} className="lx-card p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.author}</span>
                  {r.rating && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#e8c547' }}>
                      <Star size={11} fill="currentColor" /> {r.rating}/5
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed line-clamp-5" style={{ color: 'var(--text-secondary)' }}>{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lexio community reviews */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Lexio Reviews</h2>
          {isAuthenticated && (
            <button onClick={() => setShowReviewForm((o) => !o)} className="lx-btn-ghost text-sm">
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="lx-card p-4 mb-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                  <Star size={18} fill={n <= reviewForm.rating ? 'var(--lx-accent)' : 'none'} style={{ color: 'var(--lx-accent)' }} />
                </button>
              ))}
            </div>
            <textarea
              className="lx-input text-sm resize-none"
              rows={4}
              placeholder="Share your thoughts on this movie..."
              value={reviewForm.content}
              onChange={(e) => setReviewForm((f) => ({ ...f, content: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={reviewForm.has_spoilers} onChange={(e) => setReviewForm((f) => ({ ...f, has_spoilers: e.target.checked }))} />
              Contains spoilers
            </label>
            <button onClick={submitReview} disabled={submitting || !reviewForm.content.trim()} className="lx-btn-primary text-sm">
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No community reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}