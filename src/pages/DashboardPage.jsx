import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, MessageSquare, Star, Clock, CheckCircle, Bookmark, ArrowRight, Sparkles, Users, Lock, PenLine, HelpCircle, Quote } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import SetupTour from '@/components/onboarding/SetupTour';

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin' },
  { text: 'So many books, so little time.', author: 'Frank Zappa' },
  { text: 'If you only read the books that everyone else is reading, you can only think what everyone else is thinking.', author: 'Haruki Murakami' },
  { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  { text: 'I am not afraid of storms, for I am learning how to sail my ship.', author: 'Louisa May Alcott' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
];
function getDailyQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      base44.entities.UserLibrary.filter({ user_email: user.email })
        .then(setLibrary)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const stats = {
    total: library.length,
    finished: library.filter(b => b.status === 'finished').length,
    reading: library.filter(b => b.status === 'reading').length,
    want: library.filter(b => b.status === 'want_to_read').length,
    avgRating: (() => {
      const rated = library.filter(b => b.rating);
      return rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : null;
    })(),
  };

  const currentlyReading = library.filter(b => b.status === 'reading').slice(0, 3);
  const recentlyFinished = library.filter(b => b.status === 'finished').slice(0, 3);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <img
            src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio"
            className="h-16 w-16 mx-auto mb-6 rounded-xl"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Your reading life,<br />
            <span style={{ color: 'var(--lx-accent)' }}>supercharged.</span>
          </h1>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            AI-powered book discovery, a personal library tracker, and a reading companion that learns your taste.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => base44.auth.redirectToLogin()} className="lx-btn-primary py-3 px-8 text-base">
              Get Started Free <ArrowRight size={16} />
            </button>
            <button onClick={() => base44.auth.redirectToLogin()} className="lx-btn-ghost py-3 px-8 text-base">
              Sign In
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          {[
            { icon: Compass, title: 'Discover Books', desc: 'Browse trending titles and search millions of books', href: '/discover' },
            { icon: Sparkles, title: 'AI Recommendations', desc: 'Get personalized picks powered by AI', href: '/discover' },
            { icon: MessageSquare, title: 'Chat About Books', desc: 'Talk to your AI reading companion anytime', href: '/chat' },
          ].map(({ icon: Icon, title, desc, href }) => (
            <Link key={title} to={href} className="lx-card p-5 text-left group hover:border-[var(--lx-accent)] transition-colors">
              <Icon size={22} className="mb-3" style={{ color: 'var(--lx-accent)' }} />
              <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Quote of the Day */}
      {(() => { const q = getDailyQuote(); return (
        <div className="lx-card p-4 mb-6 flex items-start gap-3">
          <Quote size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
          <div>
            <p className="text-sm italic mb-1" style={{ color: 'var(--text-primary)' }}>"{q.text}"</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>— {q.author}</p>
          </div>
        </div>
      ); })()}

      {/* Welcome */}
      {showTourPrompt && user && (
        <SetupTour user={user} userProfile={null} onComplete={() => setShowTourPrompt(false)} />
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'Reader'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here's your reading overview</p>
        </div>
        <button onClick={() => setShowTourPrompt(true)} title="Retake the setup tour"
          className="lx-btn-ghost text-xs py-1.5 px-2 flex items-center gap-1 flex-shrink-0">
          <HelpCircle size={13} /> Tour
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Books', value: stats.total, icon: BookOpen, href: '/library' },
          { label: 'Finished', value: stats.finished, icon: CheckCircle, href: '/library' },
          { label: 'Reading Now', value: stats.reading, icon: Clock, href: '/library' },
          { label: 'Want to Read', value: stats.want, icon: Bookmark, href: '/library' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} to={href} className="lx-card p-4 flex flex-col items-start gap-2 hover:border-[var(--lx-accent)] transition-colors group">
            <Icon size={16} style={{ color: 'var(--lx-accent)' }} />
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{loading ? '—' : value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Avg Rating */}
      {stats.avgRating && (
        <div className="lx-card p-4 mb-8 flex items-center gap-4">
          <Star size={20} style={{ color: 'var(--lx-accent)' }} />
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Average Rating</p>
            <p className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.avgRating} / 5</p>
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { icon: Compass, title: 'Discover', desc: 'Search & explore new titles', href: '/discover', cta: 'Browse' },
          { icon: MessageSquare, title: 'Book Chat', desc: 'AI reading companion', href: '/chat', cta: 'Open Chat' },
          { icon: PenLine, title: 'Reading Log', desc: 'Track sessions & reflections', href: '/reading-log', cta: 'Log Now' },
          { icon: Users, title: 'Clubs', desc: 'Join reading communities', href: '/clubs', cta: 'Browse' },
          { icon: Lock, title: 'Vault', desc: 'Secure library cards', href: '/vault', cta: 'Open' },
          { icon: Sparkles, title: 'Wrapped', desc: 'Your year in books', href: '/wrapped', cta: 'View' },
        ].map(({ icon: Icon, title, desc, href, cta }) => (
          <Link key={title} to={href} className="lx-card p-5 flex flex-col gap-3 hover:border-[var(--lx-accent)] transition-colors group">
            <Icon size={20} style={{ color: 'var(--lx-accent)' }} />
            <div>
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
            <span className="text-xs font-semibold mt-auto flex items-center gap-1" style={{ color: 'var(--lx-accent)' }}>
              {cta} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock size={16} style={{ color: 'var(--lx-accent)' }} /> Currently Reading
            </h2>
            <Link to="/library" className="text-xs font-medium" style={{ color: 'var(--lx-accent)' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {currentlyReading.map(b => (
              <Link key={b.id} to={`/book/${b.book_id}`} className="lx-card p-3 flex items-center gap-3 hover:border-[var(--lx-accent)] transition-colors">
                {b.book_cover
                  ? <img src={b.book_cover} alt={b.book_title} className="w-10 h-14 object-cover rounded flex-shrink-0" style={{ imageRendering: 'auto' }} />
                  : <div className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                      <BookOpen size={14} style={{ color: 'var(--lx-accent)' }} />
                    </div>
                }
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{b.book_title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.book_author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Finished */}
      {recentlyFinished.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle size={16} style={{ color: 'var(--lx-accent)' }} /> Recently Finished
            </h2>
            <Link to="/library" className="text-xs font-medium" style={{ color: 'var(--lx-accent)' }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {recentlyFinished.map(b => (
              <Link key={b.id} to={`/book/${b.book_id}`} className="lx-card p-3 flex items-center gap-3 hover:border-[var(--lx-accent)] transition-colors">
                {b.book_cover
                  ? <img src={b.book_cover} alt={b.book_title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                  : <div className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--lx-accent)' }} />
                    </div>
                }
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{b.book_title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.book_author}</p>
                  {b.rating && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--lx-accent)' }}>
                      <Star size={10} fill="currentColor" /> {b.rating}/5
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && library.length === 0 && (
        <div className="lx-card p-8 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Your library is empty</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Start by discovering books and adding them to your list.</p>
          <Link to="/discover" className="lx-btn-primary text-sm">Discover Books</Link>
        </div>
      )}
    </div>
  );
}