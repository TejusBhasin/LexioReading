import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const BINGO_SQUARES = [
  'Read a book over 400 pages',
  'Read a debut novel',
  'Read a book set in a country you\'ve never visited',
  'Read a book published before 1950',
  'Read a book recommended by a friend',
  'Read a graphic novel or manga',
  'Read a non-fiction book',
  'Read a book with a one-word title',
  'Read a book with a map inside',
  'Read a book by an author you\'ve never tried',
  'Read a sequel',
  'Re-read a childhood favorite',
  '⭐ FREE\nRead any book',
  'Read a mystery or thriller',
  'Read a book in under a week',
  'Read a book over 500 pages',
  'Read a fantasy or sci-fi',
  'Read a book set in the future',
  'Read a short story collection',
  'Read a book your library recommended',
  'Read a book with a color in the title',
  'Read a biography or memoir',
  'Read a translated book',
  'Read a historical fiction',
  'Read a book with a red cover',
];

const EXTRA_CHALLENGES = [
  { title: '📚 Bookworm', desc: 'Read 5 books in a single month', xp: 50 },
  { title: '🌍 Worldly', desc: 'Read books set in 5 different countries', xp: 40 },
  { title: '⏱️ Speed Reader', desc: 'Finish a book in under 3 days', xp: 30 },
  { title: '🖊️ Critic', desc: 'Leave reviews on 10 books', xp: 35 },
  { title: '🔥 Streak Master', desc: 'Maintain a 30-day reading streak', xp: 60 },
  { title: '💬 Social Reader', desc: 'Join 3 different reading clubs', xp: 25 },
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const STORAGE_KEY = `lexio_bingo_${user?.email}_2026`;
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [library, setLibrary] = useState({ total: 0, finished: 0, reviews: 0 });

  useEffect(() => {
    if (user?.email) loadStats();
  }, [user]);

  async function loadStats() {
    const [lib, revs] = await Promise.all([
      base44.entities.UserLibrary.filter({ user_email: user.email }),
      base44.entities.Review.filter({ user_email: user.email }),
    ]);
    setLibrary({ total: lib.length, finished: lib.filter(b => b.status === 'finished').length, reviews: revs.length });
  }

  function toggle(i) {
    if (i === 12) return; // free square
    const next = checked.includes(i) ? checked.filter(x => x !== i) : [...checked, i];
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function reset() {
    setChecked([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const completedCount = checked.length + 1; // +1 for free
  const hasBingo = () => {
    const grid = Array(25).fill(false);
    checked.forEach(i => grid[i] = true);
    grid[12] = true;
    const rows = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]];
    const cols = [[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
    const diags = [[0,6,12,18,24],[4,8,12,16,20]];
    return [...rows,...cols,...diags].some(line => line.every(i => grid[i]));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Trophy size={22} style={{ color: 'var(--lx-accent)' }} /> Reading Challenges
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete squares to get BINGO · {completedCount}/25 done</p>
        </div>
        <button onClick={reset} className="lx-btn-ghost text-sm py-1.5">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {hasBingo() && (
        <div className="mb-6 p-4 rounded-xl text-center font-display text-xl font-bold animate-pulse"
          style={{ background: 'rgba(245,166,35,0.15)', border: '2px solid var(--lx-accent)', color: 'var(--lx-accent)' }}>
          🎉 BINGO! Amazing reading achievement!
        </div>
      )}

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-10">
        {['B','I','N','G','O'].map(l => (
          <div key={l} className="h-8 flex items-center justify-center font-display font-bold text-lg"
            style={{ color: 'var(--lx-accent)' }}>{l}</div>
        ))}
        {BINGO_SQUARES.map((sq, i) => {
          const isFree = i === 12;
          const done = isFree || checked.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)}
              className="aspect-square p-1.5 rounded-lg text-center transition-all flex items-center justify-center text-xs leading-tight"
              style={{
                background: done ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: done ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${done ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                fontWeight: done ? 700 : 400,
                minHeight: '70px',
              }}>
              {sq}
            </button>
          );
        })}
      </div>

      {/* Extra challenges */}
      <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Bonus Challenges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {EXTRA_CHALLENGES.map(c => {
          const done =
            (c.title.includes('Bookworm') && library.finished >= 5) ||
            (c.title.includes('Critic') && library.reviews >= 10) ||
            false;
          return (
            <div key={c.title} className="lx-card p-4 flex items-center gap-4"
              style={{ borderColor: done ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
              <div className="text-2xl flex-shrink-0">{c.title.split(' ')[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: done ? 'var(--lx-accent)' : 'var(--text-primary)' }}>{c.title.slice(2)}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
              <div className="text-xs font-bold flex-shrink-0" style={{ color: done ? '#10b981' : 'var(--text-muted)' }}>
                {done ? '✓ Done' : `+${c.xp} XP`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}