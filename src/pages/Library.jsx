import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import AppLayout from '@/components/layout/AppLayout';
import { BookOpen, Star, Trash2, Edit3, Lock, Tag } from 'lucide-react';

const STATUSES = [
  { key: 'want_to_read', label: 'Want to Read', emoji: '📖' },
  { key: 'reading', label: 'Currently Reading', emoji: '🔖' },
  { key: 'finished', label: 'Finished', emoji: '✅' },
  { key: 'dropped', label: 'Dropped', emoji: '💔' },
];

export default function Library() {
  const { user } = useLexioAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('want_to_read');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (user) loadLibrary();
    else setLoading(false);
  }, [user]);

  async function loadLibrary() {
    const items = await base44.entities.UserLibrary.filter({ user_email: user.email });
    setBooks(items);
    setLoading(false);
  }

  async function updateBook(id, data) {
    await base44.entities.UserLibrary.update(id, data);
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    setEditingId(null);
  }

  async function deleteBook(id) {
    await base44.entities.UserLibrary.delete(id);
    setBooks(prev => prev.filter(b => b.id !== id));
  }

  const filtered = books.filter(b => b.status === activeStatus);

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock size={48} className="mx-auto mb-6" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-3xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Your Library Awaits</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Sign up to track your reading, rate books, and let AI learn your taste.
          </p>
          <Link to="/signup" className="inline-flex px-8 py-4 rounded-xl font-black text-sm" style={{ background: 'var(--accent-primary)', color: '#000' }}>
            Create Free Account
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>My Library</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{books.length} books tracked</p>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STATUSES.map(s => {
            const count = books.filter(b => b.status === s.key).length;
            return (
              <button
                key={s.key}
                onClick={() => setActiveStatus(s.key)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
                style={{
                  background: activeStatus === s.key ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: activeStatus === s.key ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>{s.emoji}</span>
                {s.label}
                {count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black"
                    style={{ background: activeStatus === s.key ? 'rgba(0,0,0,0.2)' : 'var(--bg-hover)', color: activeStatus === s.key ? '#000' : 'var(--text-muted)' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{STATUSES.find(s => s.key === activeStatus)?.emoji}</div>
            <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Nothing here yet</p>
            <p style={{ color: 'var(--text-secondary)' }}>Discover books and add them to your {STATUSES.find(s => s.key === activeStatus)?.label} list.</p>
            <Link to="/" className="inline-flex mt-6 px-6 py-3 rounded-xl font-black text-sm" style={{ background: 'var(--accent-primary)', color: '#000' }}>
              Discover Books
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(book => (
              <div key={book.id} className="p-4 rounded-xl flex gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                {/* Cover */}
                <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                  {book.book_cover ? (
                    <img src={book.book_cover} alt={book.book_title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/book/${book.book_id}`}>
                    <h3 className="font-black text-base leading-tight mb-1 hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {book.book_title}
                    </h3>
                  </Link>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{book.book_author}</p>

                  {editingId === book.id ? (
                    <div className="space-y-3">
                      {/* Status select */}
                      <select
                        value={editData.status || book.status}
                        onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rating:</span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setEditData(d => ({ ...d, rating: n }))}
                          >
                            <Star
                              size={16}
                              style={{ color: 'var(--accent-primary)' }}
                              fill={(editData.rating || book.rating || 0) >= n ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                      {/* Notes */}
                      <textarea
                        value={editData.notes !== undefined ? editData.notes : (book.notes || '')}
                        onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                        placeholder="Add a note..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBook(book.id, editData)}
                          className="px-4 py-2 rounded-lg text-xs font-black"
                          style={{ background: 'var(--accent-primary)', color: '#000' }}
                        >Save</button>
                        <button
                          onClick={() => { setEditingId(null); setEditData({}); }}
                          className="px-4 py-2 rounded-lg text-xs font-bold"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center flex-wrap gap-3">
                      {/* Stars */}
                      {book.rating > 0 && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={12} style={{ color: 'var(--accent-primary)' }} fill={book.rating >= n ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      )}
                      {book.notes && (
                        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{book.notes}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId !== book.id && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingId(book.id); setEditData({}); }}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}