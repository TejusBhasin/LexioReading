import React, { useState } from 'react';
import { Plus, BookmarkCheck, Trash2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LxSelect from '@/components/ui/LxSelect';

const MOVIE_STATUSES = [
  { value: 'want_to_read', label: 'Want to Watch' },
  { value: 'reading', label: 'Watching' },
  { value: 'finished', label: 'Watched' },
  { value: 'dropped', label: 'Dropped' },
];

// Mirrors the book library flow: pick a status on add, then rate (like books).
export default function MovieWatchlistControls({ user, movie, movieId, libEntry, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState('want_to_read');
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!user) { window.location.href = '/login'; return; }
    setBusy(true);
    try {
      const created = await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: movieId,
        book_title: movie.title,
        book_author: movie.director || '',
        book_cover: movie.cover_image,
        media_type: 'movie',
        status,
        ...(status === 'finished' ? { date_finished: new Date().toISOString(), rating: rating || undefined } : {}),
        date_added: new Date().toISOString(),
      });
      onChanged(created);
      setAdding(false);
      setStatus('want_to_read');
      setRating(0);
    } catch (e) {}
    setBusy(false);
  }

  async function updateStatus(s) {
    try {
      const upd = await base44.entities.UserLibrary.update(libEntry.id, {
        status: s,
        ...(s === 'finished' ? { date_finished: new Date().toISOString() } : {}),
      });
      onChanged(upd);
    } catch (e) {}
  }

  async function updateRating(n) {
    try {
      const upd = await base44.entities.UserLibrary.update(libEntry.id, { rating: n });
      onChanged(upd);
    } catch (e) {}
  }

  async function remove() {
    try { await base44.entities.UserLibrary.delete(libEntry.id); onChanged(null); } catch (e) {}
  }

  if (!libEntry) {
    return (
      <div className="mt-2">
        {!adding ? (
          <button onClick={() => setAdding(true)} className="lx-btn-primary text-sm">
            <Plus size={14} /> Add to Watchlist
          </button>
        ) : (
          <div className="lx-card p-3 space-y-3 overflow-hidden">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>What's your status?</p>
            <div className="flex gap-1.5 flex-wrap">
              {MOVIE_STATUSES.filter((s) => s.value !== 'dropped').map((s) => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className="text-xs px-3 py-1.5 rounded transition-all"
                  style={{ background: status === s.value ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: status === s.value ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${status === s.value ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                  {s.label}
                </button>
              ))}
            </div>
            {status === 'finished' && (
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rate it:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star size={18} fill={n <= rating ? 'var(--lx-accent)' : 'none'} style={{ color: 'var(--lx-accent)' }} />
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <button onClick={add} disabled={busy} className="lx-btn-primary text-sm flex-1 justify-center min-w-0">{busy ? 'Adding...' : 'Add to Watchlist'}</button>
              <button onClick={() => setAdding(false)} className="lx-btn-ghost text-sm flex-shrink-0">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lx-card p-3 space-y-2 mt-2 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--lx-accent)' }}>
          <BookmarkCheck size={13} /> In Watchlist
        </span>
        <button onClick={remove} className="p-1 rounded" style={{ color: 'var(--text-muted)' }} title="Remove">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <LxSelect value={libEntry.status} onChange={updateStatus}
          options={MOVIE_STATUSES.map((s) => ({ value: s.value, label: s.label }))} compact />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Your rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => updateRating(n)}>
            <Star size={16} fill={n <= (libEntry.rating || 0) ? 'var(--lx-accent)' : 'none'} style={{ color: 'var(--lx-accent)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}