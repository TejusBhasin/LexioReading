import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Star, Trash2, Edit3, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const STATUSES = [
  { key: 'all', label: 'All Books' },
  { key: 'reading', label: 'Reading' },
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'finished', label: 'Finished' },
  { key: 'dropped', label: 'Dropped' },
];

const STATUS_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
  dropped: 'Dropped',
};

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadLibrary();
  }, [user]);

  async function loadLibrary() {
    setLoading(true);
    try {
      const lib = await base44.entities.UserLibrary.filter({ user_email: user.email }, '-created_date', 100);
      setBooks(lib);
    } catch (e) {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await base44.entities.UserLibrary.update(id, {
        status,
        ...(status === 'finished' ? { date_finished: new Date().toISOString() } : {}),
      });
      setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (e) {}
  }

  async function updateRating(id, rating) {
    try {
      await base44.entities.UserLibrary.update(id, { rating });
      setBooks(prev => prev.map(b => b.id === id ? { ...b, rating } : b));
    } catch (e) {}
  }

  async function saveNote(id) {
    try {
      await base44.entities.UserLibrary.update(id, { notes: editNote });
      setBooks(prev => prev.map(b => b.id === id ? { ...b, notes: editNote } : b));
      setEditingId(null);
    } catch (e) {}
  }

  async function removeBook(id) {
    try {
      await base44.entities.UserLibrary.delete(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (e) {}
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <BookOpen size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Your library lives here
        </h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to track your books, ratings, and reading journey.</p>
        <Link to="/signup" className="lx-btn-primary">Get Started Free</Link>
      </div>
    );
  }

  const filtered = activeStatus === 'all' ? books : books.filter(b => b.status === activeStatus);

  const stats = {
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    finished: books.filter(b => b.status === 'finished').length,
    want: books.filter(b => b.status === 'want_to_read').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Library
        </h1>
        <div className="flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--lx-accent)' }}>{stats.finished}</strong> finished</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{stats.reading}</strong> reading</span>
          <span><strong style={{ color: 'var(--text-secondary)' }}>{stats.want}</strong> queued</span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveStatus(key)}
            className="px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeStatus === key ? 'var(--lx-accent)' : 'var(--bg-card)',
              color: activeStatus === key ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${activeStatus === key ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}
          >
            {label}
            {key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {books.filter(b => b.status === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded" style={{ background: 'var(--bg-card)', opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {activeStatus === 'all' ? 'Your library is empty. Start discovering books!' : `No ${STATUS_LABELS[activeStatus]?.toLowerCase() || ''} books yet.`}
          </p>
          <Link to="/" className="inline-block mt-4 lx-btn-primary text-sm">
            Discover Books
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(book => (
            <div
              key={book.id}
              className="lx-card flex gap-3 p-3"
            >
              {/* Cover */}
              <Link to={`/book/${book.book_id}`} className="flex-shrink-0">
                {book.book_cover ? (
                  <img src={book.book_cover} alt={book.book_title} className="w-12 h-16 object-cover rounded" />
                ) : (
                  <div className="w-12 h-16 rounded flex items-center justify-center text-xs text-center"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {book.book_title?.slice(0, 2)}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/book/${book.book_id}`}>
                      <h3 className="font-semibold text-sm truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {book.book_title}
                      </h3>
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{book.book_author}</p>
                  </div>

                  {/* Status Select */}
                  <select
                    value={book.status}
                    onChange={e => updateStatus(book.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--lx-border)',
                    }}
                  >
                    {STATUSES.filter(s => s.key !== 'all').map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateRating(book.id, n)}>
                      <Star
                        size={13}
                        fill={n <= (book.rating || 0) ? 'var(--lx-accent)' : 'none'}
                        style={{ color: 'var(--lx-accent)' }}
                      />
                    </button>
                  ))}
                </div>

                {/* Notes */}
                {editingId === book.id ? (
                  <div className="flex gap-1 mt-1.5">
                    <input
                      className="lx-input text-xs py-1 flex-1"
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="Add a note..."
                      autoFocus
                    />
                    <button onClick={() => saveNote(book.id)} style={{ color: 'var(--lx-accent)' }}><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {book.notes ? (
                      <p className="text-xs italic line-clamp-1 flex-1" style={{ color: 'var(--text-muted)' }}>"{book.notes}"</p>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No note</span>
                    )}
                    <button
                      onClick={() => { setEditingId(book.id); setEditNote(book.notes || ''); }}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => removeBook(book.id)} style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}