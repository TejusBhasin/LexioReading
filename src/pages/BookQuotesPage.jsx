import React, { useState, useEffect } from 'react';
import { Quote, Plus, Trash2, Heart, Search, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function BookQuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ book_title: '', book_author: '', quote: '', page_number: '', chapter: '' });
  const [saving, setSaving] = useState(false);
  const [library, setLibrary] = useState([]);

  useEffect(() => {
    if (user?.email) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [qs, lib] = await Promise.all([
      base44.entities.BookQuote.filter({ user_email: user.email }, '-created_date', 200),
      base44.entities.UserLibrary.filter({ user_email: user.email }),
    ]);
    setQuotes(qs);
    setLibrary(lib);
    setLoading(false);
  }

  async function save() {
    if (!form.quote.trim() || !form.book_title.trim()) return;
    setSaving(true);
    await base44.entities.BookQuote.create({ ...form, user_email: user.email, page_number: form.page_number ? parseInt(form.page_number) : undefined });
    setForm({ book_title: '', book_author: '', quote: '', page_number: '', chapter: '' });
    setShowForm(false);
    loadData();
    setSaving(false);
  }

  async function toggleFav(q) {
    await base44.entities.BookQuote.update(q.id, { is_favorite: !q.is_favorite });
    setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, is_favorite: !x.is_favorite } : x));
  }

  async function deleteQuote(id) {
    await base44.entities.BookQuote.delete(id);
    setQuotes(prev => prev.filter(q => q.id !== id));
  }

  function fillFromBook(book) {
    setForm(f => ({ ...f, book_title: book.book_title, book_author: book.book_author }));
  }

  const filtered = quotes.filter(q =>
    q.quote?.toLowerCase().includes(search.toLowerCase()) ||
    q.book_title?.toLowerCase().includes(search.toLowerCase())
  );
  const favs = filtered.filter(q => q.is_favorite);
  const rest = filtered.filter(q => !q.is_favorite);
  const displayed = [...favs, ...rest];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Quote size={22} style={{ color: 'var(--lx-accent)' }} /> My Book Quotes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Collect your favorite passages</p>
        </div>
        <button onClick={() => setShowForm(o => !o)} className="lx-btn-primary text-sm">
          <Plus size={13} /> Add Quote
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="lx-card p-5 mb-6 space-y-3" style={{ borderColor: 'var(--lx-accent)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>New Quote</h3>
          {library.length > 0 && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Quick fill from library</label>
              <select className="lx-input text-sm" onChange={e => {
                const b = library.find(x => x.id === e.target.value);
                if (b) fillFromBook(b);
              }}>
                <option value="">— Pick a book —</option>
                {library.map(b => <option key={b.id} value={b.id}>{b.book_title}</option>)}
              </select>
            </div>
          )}
          <input className="lx-input text-sm" placeholder="Book title *" value={form.book_title} onChange={e => setForm(f => ({ ...f, book_title: e.target.value }))} />
          <input className="lx-input text-sm" placeholder="Author" value={form.book_author} onChange={e => setForm(f => ({ ...f, book_author: e.target.value }))} />
          <textarea className="lx-input text-sm resize-none" rows={4} placeholder="Quote *" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
          <div className="flex gap-2">
            <input className="lx-input text-sm" placeholder="Page #" type="number" value={form.page_number} onChange={e => setForm(f => ({ ...f, page_number: e.target.value }))} />
            <input className="lx-input text-sm" placeholder="Chapter" value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.quote.trim() || !form.book_title.trim()} className="lx-btn-primary text-sm">
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
            <button onClick={() => setShowForm(false)} className="lx-btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="lx-input pl-9 text-sm" placeholder="Search quotes or books..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{quotes.length} saved quote{quotes.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="lx-card p-5 h-28 animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <Quote size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No quotes yet</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Start saving passages that moved you</p>
          <button onClick={() => setShowForm(true)} className="lx-btn-primary text-sm">Add First Quote</button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(q => (
            <div key={q.id} className="lx-card p-5" style={{ borderColor: q.is_favorite ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
              <blockquote className="text-base italic leading-relaxed mb-3" style={{ color: 'var(--text-primary)', borderLeft: '3px solid var(--lx-accent)', paddingLeft: '1rem' }}>
                "{q.quote}"
              </blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    — {q.book_title}
                    {q.book_author && <span style={{ color: 'var(--text-muted)' }}> by {q.book_author}</span>}
                  </p>
                  {(q.page_number || q.chapter) && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {q.chapter && `${q.chapter}`}{q.page_number && `  p.${q.page_number}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleFav(q)}>
                    <Heart size={16} fill={q.is_favorite ? 'var(--lx-accent)' : 'none'} style={{ color: 'var(--lx-accent)' }} />
                  </button>
                  <button onClick={() => deleteQuote(q.id)}>
                    <Trash2 size={15} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}