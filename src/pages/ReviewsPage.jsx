import React, { useState, useEffect } from 'react';
import { Star, Search, Sparkles, BookOpen, TrendingUp, Send, Check } from 'lucide-react';
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
            <ReviewItem key={review.id} review={review} />
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

      {/* Contact Us */}
      {user && <ContactForm user={user} />}
    </div>
  );
}

function ContactForm({ user }) {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    const reqs = await base44.entities.ContactRequest.filter({ user_email: user.email }, '-created_date', 20);
    setMyRequests(reqs);
  }

  async function submit() {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    await base44.entities.ContactRequest.create({
      ...form,
      user_email: user.email,
      username: user.full_name || user.email,
    });
    setForm({ subject: '', message: '' });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    loadHistory();
    setSending(false);
  }

  return (
    <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--lx-border)' }}>
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Contact Us</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Have a question, issue, or feedback? We'll get back to you.</p>

      <div className="lx-card p-5 space-y-3 mb-4">
        <input className="lx-input text-sm" placeholder="Subject..."
          value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
        <textarea className="lx-input text-sm resize-none" rows={4} placeholder="Your message..."
          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        <button onClick={submit} disabled={sending || !form.subject.trim() || !form.message.trim()} className="lx-btn-primary text-sm">
          {sent ? <><Check size={13} /> Sent!</> : sending ? 'Sending...' : <><Send size={13} /> Send Message</>}
        </button>
      </div>

      {myRequests.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(o => !o)} className="text-sm mb-3" style={{ color: 'var(--lx-accent)' }}>
            {showHistory ? 'Hide' : 'View'} my previous requests ({myRequests.length})
          </button>
          {showHistory && (
            <div className="space-y-3">
              {myRequests.map(req => (
                <div key={req.id} className="lx-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{req.subject}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: req.status === 'replied' ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                      color: req.status === 'replied' ? '#10b981' : 'var(--text-muted)'
                    }}>{req.status}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{req.message}</p>
                  {req.admin_reply && (
                    <div className="p-3 rounded text-sm" style={{ background: 'rgba(245,166,35,0.1)', borderLeft: '2px solid var(--lx-accent)' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>Admin Reply</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{req.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ review }) {
  const stars = Math.round(review.rating || 0);
  return (
    <div className="lx-card p-5">
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