import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
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
  const SQUARES_KEY = `lexio_bingo_squares_${user?.email}_2026`;
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [squares, setSquares] = useState(() => {
    try { const s = localStorage.getItem(SQUARES_KEY); return s ? JSON.parse(s) : BINGO_SQUARES; } catch { return BINGO_SQUARES; }
  });
  const [generating, setGenerating] = useState(false);
  const [library, setLibrary] = useState({ total: 0, finished: 0, reviews: 0, genres: [] });
  const [rawLibrary, setRawLibrary] = useState([]);

  useEffect(() => {
    if (user?.email) loadStats();
  }, [user]);

  async function loadStats() {
    const [lib, revs] = await Promise.all([
      base44.entities.UserLibrary.filter({ user_email: user.email }),
      base44.entities.Review.filter({ user_email: user.email }),
    ]);
    const genres = [...new Set(lib.flatMap(b => b.tags || []))].slice(0, 6);
    setRawLibrary(lib);
    setLibrary({ total: lib.length, finished: lib.filter(b => b.status === 'finished').length, reviews: revs.length, genres });
    autoFillSquares(lib, squares);
  }

  function autoFillSquares(lib, currentSquares) {
    const allTags = lib.flatMap(b => b.tags || []).map(t => t.toLowerCase());
    const allTitles = lib.map(b => (b.book_title || ''));
    const finishedBooks = lib.filter(b => b.status === 'finished');

    const hasGenre = (genre) => allTags.some(t => t.includes(genre));

    const autoChecked = [];
    currentSquares.forEach((sq, i) => {
      if (i === 12) return;
      const text = sq.toLowerCase();

      // Genre-based checks
      if ((text.includes('non-fiction') || text.includes('nonfiction')) && hasGenre('non-fiction')) autoChecked.push(i);
      if (text.includes('fantasy') && hasGenre('fantasy')) autoChecked.push(i);
      if (text.includes('sci-fi') && (hasGenre('science fiction') || hasGenre('sci-fi'))) autoChecked.push(i);
      if ((text.includes('mystery') || text.includes('thriller')) && (hasGenre('mystery') || hasGenre('thriller'))) autoChecked.push(i);
      if ((text.includes('biography') || text.includes('memoir')) && (hasGenre('biography') || hasGenre('memoir'))) autoChecked.push(i);
      if (text.includes('historical') && hasGenre('historical')) autoChecked.push(i);
      if ((text.includes('graphic novel') || text.includes('manga')) && (hasGenre('graphic') || hasGenre('manga'))) autoChecked.push(i);
      if (text.includes('romance') && hasGenre('romance')) autoChecked.push(i);
      if (text.includes('horror') && hasGenre('horror')) autoChecked.push(i);
      if (text.includes('poetry') && hasGenre('poetry')) autoChecked.push(i);

      // Title-based checks
      if (text.includes('one-word title') && allTitles.some(t => t.trim().split(/\s+/).length === 1)) autoChecked.push(i);
      if (text.includes('color in the title')) {
        const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange', 'pink', 'gold', 'silver', 'brown', 'gray', 'grey', 'crimson', 'scarlet'];
        if (allTitles.some(t => colors.some(c => t.toLowerCase().includes(c)))) autoChecked.push(i);
      }

      // Page count checks
      if (text.includes('over 500 pages') && finishedBooks.some(b => (b.page_count || b.pages || 0) >= 500)) autoChecked.push(i);
      if (text.includes('over 400 pages') && finishedBooks.some(b => (b.page_count || b.pages || 0) >= 400)) autoChecked.push(i);

      // Sequel detection
      if (text.includes('sequel') && lib.some(b => /\b2\b|ii\b|book two|part two|#2/i.test(b.book_title || ''))) autoChecked.push(i);

      // Re-read check (has read a book more than once - check if any book appears twice or has re-read tag)
      if (text.includes('re-read') || text.includes('reread')) {
        if (lib.some(b => (b.tags || []).some(t => t.toLowerCase().includes('re-read') || t.toLowerCase().includes('reread')))) autoChecked.push(i);
      }
    });

    setChecked(prev => {
      const merged = [...new Set([...prev, ...autoChecked])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }

  async function generateAISquares() {
    setGenerating(true);
    const result = await base44.functions.invoke('challengeBingoSquares', {
      finished_count: library.finished,
      genres: library.genres,
    });
    const newSquares = result.data?.squares?.slice(0, 25) || BINGO_SQUARES;
    // Ensure 25 squares, with free square at index 12
    while (newSquares.length < 25) newSquares.push(BINGO_SQUARES[newSquares.length]);
    newSquares[12] = '⭐ FREE\nRead any book';
    setSquares(newSquares);
    localStorage.setItem(SQUARES_KEY, JSON.stringify(newSquares));
    setGenerating(false);
    if (rawLibrary.length > 0) autoFillSquares(rawLibrary, newSquares);
  }

  function toggle(i) {
    if (i === 12) return;
    const next = checked.includes(i) ? checked.filter(x => x !== i) : [...checked, i];
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function reset() {
    setChecked([]);
    localStorage.removeItem(STORAGE_KEY);
    generateAISquares();
  }

  const completedCount = checked.length + 1;
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
        <div className="flex gap-2">
          <button onClick={generateAISquares} disabled={generating} className="lx-btn-primary text-sm py-1.5">
            <Sparkles size={13} /> {generating ? 'Generating...' : 'AI Generate'}
          </button>
          <button onClick={reset} disabled={generating} className="lx-btn-ghost text-sm py-1.5">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {hasBingo() && (
        <div className="mb-6 p-4 rounded-xl text-center font-display text-xl font-bold animate-pulse"
          style={{ background: 'rgba(245,166,35,0.15)', border: '2px solid var(--lx-accent)', color: 'var(--lx-accent)' }}>
          🎉 BINGO! Amazing reading achievement!
        </div>
      )}

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-1 mb-10 overflow-hidden">
        {['B','I','N','G','O'].map(l => (
          <div key={l} className="h-7 flex items-center justify-center font-display font-bold text-base"
            style={{ color: 'var(--lx-accent)' }}>{l}</div>
        ))}
        {squares.map((sq, i) => {
          const isFree = i === 12;
          const done = isFree || checked.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)}
              className="min-h-[72px] p-1 rounded-lg text-center transition-all flex items-center justify-center text-[9px] sm:text-[11px] leading-tight break-words whitespace-pre-line overflow-hidden"
              style={{
                background: done ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: done ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${done ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                fontWeight: done ? 700 : 400,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
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