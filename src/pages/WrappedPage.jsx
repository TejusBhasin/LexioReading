import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Clock, Star, Heart, TrendingUp, Share2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

function isWrappedSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  // Nov 1 - Feb 1
  if (month === 11 || month === 12) return true;
  if (month === 1 && day <= 1) return true;
  return true; // Always on for dev/demo - in production check above
}

const PERSONALITY_TYPES = [
  { key: 'explorer', label: '🌍 The Explorer', desc: 'You read across genres, always hungry for new worlds.' },
  { key: 'deep_diver', label: '🐠 The Deep Diver', desc: 'You pick fewer books but absorb every word.' },
  { key: 'emotionalist', label: '💜 The Emotionalist', desc: 'Stories move you deeply. You read with your heart.' },
  { key: 'thrill_seeker', label: '⚡ The Thrill Seeker', desc: 'Fast-paced, high-stakes — you live for the rush.' },
  { key: 'dreamer', label: '✨ The Dreamer', desc: 'Fantastical worlds and literary escapes are your sanctuary.' },
];

export default function WrappedPage() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [personality, setPersonality] = useState(null);
  const [slide, setSlide] = useState(0);

  const season = isWrappedSeason();
  const year = new Date().getFullYear();

  useEffect(() => {
    if (isAuthenticated && user?.email) loadData();
    else setLoading(false);
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [library, logs, reviews] = await Promise.all([
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.ReadingLog.filter({ user_email: user.email }).catch(() => []),
        base44.entities.Review.filter({ user_email: user.email }).catch(() => []),
      ]);

      const finished = library.filter(b => b.status === 'finished');
      const totalMinutes = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
      const genres = {};
      library.forEach(b => {
        (b.book_categories || []).forEach(g => { genres[g] = (genres[g] || 0) + 1; });
      });
      const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
      const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
      const reflections = logs.filter(l => l.reflection).slice(0, 3).map(l => l.reflection);

      setData({ finished, totalMinutes, topGenres, avgRating, reflections, totalLogs: logs.length, library });
    } catch (e) {}
    setLoading(false);
  }

  async function generatePersonality() {
    if (!data) return;
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this reader's ${year} stats, assign them a reading personality type:
Books finished: ${data.finished.length}
Top genres: ${data.topGenres.join(', ')}
Total reading sessions: ${data.totalLogs}
Sample reflections: ${data.reflections.join(' | ') || 'none'}

Choose ONE from: explorer, deep_diver, emotionalist, thrill_seeker, dreamer
Also write a 2-sentence personalized reading personality summary.`,
        response_json_schema: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            summary: { type: 'string' },
          }
        }
      });
      const pType = PERSONALITY_TYPES.find(p => p.key === result?.type) || PERSONALITY_TYPES[0];
      setPersonality({ ...pType, summary: result?.summary || pType.desc });
    } catch (e) {
      setPersonality(PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)]);
    }
    setGenerating(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Sparkles size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Reading Wrapped</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to see your year in books.</p>
        <Link to="/login" className="lx-btn-primary">Sign In</Link>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{year} Reading Wrapped</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Wrapped is available November 1 – February 1. Come back then!</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const slides = [
    {
      id: 'intro',
      content: (
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-6" style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Your {year} in Books
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Let's look back at your incredible reading year.</p>
          <div className="mt-6 text-5xl">📚</div>
        </div>
      )
    },
    {
      id: 'books',
      content: (
        <div className="text-center">
          <BookOpen size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>You finished</p>
          <div className="font-display text-8xl font-black mb-2" style={{ color: 'var(--lx-accent)' }}>
            {data?.finished.length || 0}
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>books this year</p>
          {data?.finished.slice(0, 3).map(b => (
            <div key={b.id} className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>📖 {b.book_title}</div>
          ))}
        </div>
      )
    },
    {
      id: 'time',
      content: (
        <div className="text-center">
          <Clock size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>Total reading time</p>
          <div className="font-display text-8xl font-black mb-2" style={{ color: 'var(--lx-accent)' }}>
            {data ? Math.round(data.totalMinutes / 60) : 0}
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>hours</p>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>That's {data ? Math.round(data.totalMinutes / 60 / 24 * 10) / 10 : 0} full days of reading!</p>
        </div>
      )
    },
    {
      id: 'genres',
      content: (
        <div className="text-center">
          <TrendingUp size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <p className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>Your top genres</p>
          {data?.topGenres.length > 0 ? (
            <div className="space-y-3">
              {data.topGenres.map((g, i) => (
                <div key={g} className="font-display text-2xl font-bold" style={{ color: i === 0 ? 'var(--lx-accent)' : 'var(--text-primary)', opacity: 1 - i * 0.2 }}>
                  {['🥇', '🥈', '🥉'][i]} {g}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Add categories to your books to see genre stats!</p>
          )}
        </div>
      )
    },
    {
      id: 'personality',
      content: (
        <div className="text-center">
          <Heart size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <p className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>Your reading personality</p>
          {personality ? (
            <div>
              <div className="font-display text-3xl font-black mb-3" style={{ color: 'var(--lx-accent)' }}>{personality.label}</div>
              <p className="text-base leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>{personality.summary}</p>
            </div>
          ) : (
            <div>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Let AI analyze your reading year.</p>
              <button onClick={generatePersonality} disabled={generating} className="lx-btn-primary">
                <Sparkles size={14} /> {generating ? 'Analyzing...' : 'Reveal My Reading Personality'}
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'share',
      content: (
        <div className="text-center">
          <Share2 size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>That's a wrap! 🎉</h2>
          <div className="grid grid-cols-2 gap-3 my-6 text-left">
            {[
              { label: 'Books Finished', value: data?.finished.length || 0 },
              { label: 'Hours Read', value: Math.round((data?.totalMinutes || 0) / 60) + 'h' },
              { label: 'Top Genre', value: data?.topGenres[0] || '—' },
              { label: 'Avg Rating', value: data?.avgRating ? data.avgRating + ' ★' : '—' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="font-display text-xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Keep reading in {year + 1}!</p>
          <Link to="/discover" className="lx-btn-primary">Discover More Books</Link>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>

      {/* Wrapped Card */}
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl p-10 min-h-[480px] flex flex-col items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', boxShadow: 'var(--lx-shadow-card)' }}>

          {/* Slide content */}
          <div className="flex-1 flex items-center justify-center w-full">
            {slides[slide].content}
          </div>

          {/* Navigation */}
          <div className="w-full mt-8">
            <div className="flex justify-center gap-1 mb-4">
              {slides.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all" style={{
                  width: i === slide ? '24px' : '6px',
                  background: i === slide ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                }} />
              ))}
            </div>
            <div className="flex gap-2">
              {slide > 0 && (
                <button onClick={() => setSlide(s => s - 1)} className="lx-btn-ghost flex-1 justify-center text-sm">← Back</button>
              )}
              {slide < slides.length - 1 && (
                <button onClick={() => setSlide(s => s + 1)} className="lx-btn-primary flex-1 justify-center text-sm">Next →</button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Lexio {year} Reading Wrapped
        </p>
      </div>
    </div>
  );
}