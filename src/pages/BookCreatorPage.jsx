import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getStudentRestrictions } from '@/lib/studentRestrictions';
import { calcChapterCount, countWords } from '@/lib/bookCreator';
import BookChat from '@/components/bookcreator/BookChat';
import BookResult from '@/components/bookcreator/BookResult';
import BookLibrary from '@/components/bookcreator/BookLibrary';
import GenreSelect from '@/components/bookcreator/GenreSelect';
import StyleSelect from '@/components/bookcreator/StyleSelect';
import { Feather, AlertTriangle, ArrowLeft, Sparkles, Loader2, Library, Plus } from 'lucide-react';

// ---- Generation progress persistence (mobile-safe resume) ----
// Book generation runs many minutes. On phones/tablets the OS suspends or
// discards the page mid-generation, which used to black out the screen and
// lose all progress. Progress is saved locally after every chapter so an
// interrupted book resumes automatically on reload.
const GEN_KEY = 'lexio_book_gen_progress';

function loadGenProgress() {
  try { return JSON.parse(localStorage.getItem(GEN_KEY) || 'null'); } catch (e) { return null; }
}
function saveGenProgress(state) {
  try { localStorage.setItem(GEN_KEY, JSON.stringify(state)); } catch (e) {}
}
function clearGenProgress() {
  try { localStorage.removeItem(GEN_KEY); } catch (e) {}
}

// Retry transient failures (mobile network blips, page suspended mid-request).
async function invokeWithRetry(payload, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await base44.functions.invoke('generateCustomBook', payload); }
    catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr;
}

export default function BookCreatorPage() {
  const { user } = useAuth();
  const [view, setView] = useState('create');
  const [phase, setPhase] = useState('genre');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [lexileLevel, setLexileLevel] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [bookSpec, setBookSpec] = useState(null);
  const [book, setBook] = useState(null);
  const [fromLibrary, setFromLibrary] = useState(false);
  const [pageCount, setPageCount] = useState(50);
  const [useMinPages, setUseMinPages] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, title: '' });
  const [error, setError] = useState('');
  const [restricted, setRestricted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.email) { setChecking(false); return; }
    Promise.all([
      getStudentRestrictions(user.email),
      base44.entities.UserProfile.filter({ user_email: user.email }),
    ]).then(([restrs, profiles]) => {
      setRestricted(restrs.includes('book_creator'));
      setAuthorName(profiles[0]?.username || user.email.split('@')[0]);
    }).catch(() => {}).finally(() => setChecking(false));
  }, [user]);

  // Resume an interrupted or unsaved generation after a reload (mobile OS
  // discards the page mid-generation).
  useEffect(() => {
    if (!user?.email) return;
    const saved = loadGenProgress();
    if (!saved || saved.user_email !== user.email) return;
    if (saved.done && saved.finalBook) {
      setBook(saved.finalBook);
      setBookSpec(saved.spec);
      setFromLibrary(false);
      setPhase('result');
    } else if (!saved.done && saved.chapters?.length) {
      generateBook(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  async function generateBook(resumeState) {
    let state = resumeState;

    // Fresh start: continue any interrupted generation for the same book.
    if (!state) {
      const saved = loadGenProgress();
      if (saved && saved.user_email === user?.email && !saved.done && saved.spec?.title === bookSpec?.title) {
        state = saved;
      }
    }

    if (!state) {
      const chapterCount = calcChapterCount(pageCount);
      const wordsPerChapter = Math.round((pageCount * 280) / chapterCount);
      state = {
        user_email: user?.email,
        spec: { ...bookSpec, writing_style: selectedStyle, lexile_level: lexileLevel, age_range: ageRange },
        author: authorName || 'Anonymous',
        chapterCount,
        wordsPerChapter,
        chapters: [],
        generated: [],
      };
    }

    setPhase('generating');
    setError('');
    setBookSpec(state.spec);

    try {
      if (state.chapters.length === 0) {
        const outlineResult = await invokeWithRetry({
          action: 'outline',
          spec: state.spec,
          chapter_count: state.chapterCount,
          words_per_chapter: state.wordsPerChapter,
        });
        state.chapters = outlineResult.data?.chapters || [];
        if (state.chapters.length === 0) throw new Error('No chapters generated');
        saveGenProgress(state);
      }

      setProgress({ current: state.generated.length, total: state.chapters.length, title: state.chapters[state.generated.length]?.title || '' });

      for (let i = state.generated.length; i < state.chapters.length; i++) {
        const ch = state.chapters[i];
        const prevEnding = state.generated.length > 0
          ? state.generated[state.generated.length - 1].content.split('\n').filter(l => l.trim()).slice(-2).join(' ')
          : '';
        const result = await invokeWithRetry({
          action: 'chapter',
          spec: state.spec,
          chapter: ch,
          num: i + 1,
          total: state.chapters.length,
          words_per_chapter: state.wordsPerChapter,
          prev_ending: prevEnding,
        });
        const text = result.data?.text || String(result.data);
        state.generated.push({ title: ch.title, content: text });
        saveGenProgress(state);
        setProgress({ current: i + 1, total: state.chapters.length, title: ch.title });
      }

      const finalBook = { title: state.spec.title, author: state.author || 'Anonymous', chapters: state.generated };
      state.done = true;
      state.finalBook = finalBook;
      saveGenProgress(state); // kept until the book is safely stored in the library
      setBook(finalBook);
      setFromLibrary(false);
      setPhase('result');

      // Save to database
      try {
        const bookJson = JSON.stringify(finalBook);
        const file = new File([bookJson], `${finalBook.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`, { type: 'application/json' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.CreatedBook.create({
          user_email: user.email,
          title: finalBook.title,
          author: finalBook.author,
          genre: state.spec.genre || '',
          description: state.spec.description || '',
          book_file_url: file_url,
          chapter_count: finalBook.chapters.length,
          word_count: countWords(finalBook.chapters),
          page_count: Math.round(countWords(finalBook.chapters) / 280),
        });
        clearGenProgress();
      } catch (e) {}
    } catch (e) {
      setError((e.message || 'Failed to generate book.') + ' Your progress is saved — tap "Create My Book" again or reload the page to continue where it stopped.');
      setPhase('confirm');
    }
  }

  function startOver() {
    clearGenProgress();
    setPhase('genre');
    setSelectedGenre(null);
    setSelectedStyle(null);
    setLexileLevel('');
    setAgeRange('');
    setBookSpec(null);
    setBook(null);
    setFromLibrary(false);
    setError('');
  }

  function viewLibraryBook(bookData) {
    setBook(bookData);
    setFromLibrary(true);
    setView('create');
    setPhase('result');
  }

  if (checking) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (restricted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Custom Book Creator is Restricted</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your school has disabled this feature. Contact your school administrator for more information.</p>
      </div>
    );
  }

  // LIBRARY VIEW
  if (view === 'library') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={false} onClick={() => setView('create')} icon={Plus} label="Create" />
          <TabButton active={true} onClick={() => {}} icon={Library} label="My Books" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <BookLibrary user={user} onViewBook={viewLibraryBook} onBack={() => setView('create')} />
        </div>
      </div>
    );
  }

  // GENRE PHASE
  if (phase === 'genre') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={true} onClick={() => {}} icon={Plus} label="Create" />
          <TabButton active={false} onClick={() => setView('library')} icon={Library} label="My Books" />
        </div>
        <div className="flex-1 min-h-0">
          <GenreSelect onSelect={(g) => { setSelectedGenre(g); setPhase('style'); }} />
        </div>
      </div>
    );
  }

  // STYLE PHASE
  if (phase === 'style') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={true} onClick={() => setPhase('genre')} icon={Plus} label="Create" />
          <TabButton active={false} onClick={() => setView('library')} icon={Library} label="My Books" />
        </div>
        <div className="flex-1 min-h-0">
          <StyleSelect genre={selectedGenre} onSelect={(s) => { setSelectedStyle(s); setPhase('chat'); }} />
        </div>
      </div>
    );
  }

  // CHAT PHASE
  if (phase === 'chat') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={true} onClick={() => setPhase('genre')} icon={Plus} label="Create" />
          <TabButton active={false} onClick={() => setView('library')} icon={Library} label="My Books" />
        </div>
        {(selectedGenre || selectedStyle) && (
          <div className="px-4 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
            <button onClick={() => setPhase('style')} className="flex items-center gap-2">
              <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
              {selectedGenre && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{selectedGenre}</span>}
              {selectedStyle && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{selectedStyle}</span>}
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <BookChat genre={selectedGenre} style={selectedStyle} onBookReady={(spec) => { setBookSpec(spec); setPhase('confirm'); }} />
        </div>
      </div>
    );
  }

  // CONFIRM PHASE
  if (phase === 'confirm' && bookSpec) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={startOver} className="lx-btn-ghost text-sm mb-5 py-1.5 px-3">
          <ArrowLeft size={14} /> Back to Chat
        </button>

        <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} style={{ color: 'var(--lx-accent)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>BOOK SPECIFICATION</span>
          </div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{bookSpec.title}</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{bookSpec.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {[bookSpec.genre, bookSpec.target_audience, bookSpec.tone, ...(bookSpec.themes || [])].filter(Boolean).map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{tag}</span>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Settings */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Author Name</label>
            <input className="lx-input text-sm" value={authorName} onChange={e => setAuthorName(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>{useMinPages ? 'Minimum Pages' : 'Target Pages'}</label>
              <button onClick={() => setUseMinPages(v => !v)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                {useMinPages ? 'Switch to exact' : 'Switch to minimum'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min="10" max="300" step="5" value={pageCount} onChange={e => setPageCount(Number(e.target.value))}
                className="flex-1" style={{ accentColor: 'var(--lx-accent)' }} />
              <span className="font-bold text-lg w-14 text-center" style={{ color: 'var(--lx-accent)' }}>{pageCount}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {useMinPages ? `Book will be at least ${pageCount} pages` : `Book will be approximately ${pageCount} pages`} · ~{(pageCount * 280).toLocaleString()} words · {calcChapterCount(pageCount)} chapters
            </p>
          </div>
        </div>

        {/* Lexile & Age Range */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Target Lexile Level</label>
            <select className="lx-input text-sm" value={lexileLevel} onChange={e => setLexileLevel(e.target.value)}>
              <option value="">N/A</option>
              <option value="BR-100L">BR – 100L (Early Reader)</option>
              <option value="100L-300L">100L – 300L (Early Elementary)</option>
              <option value="300L-500L">300L – 500L (Late Elementary)</option>
              <option value="500L-700L">500L – 700L (Middle School)</option>
              <option value="700L-900L">700L – 900L (Mid/High School)</option>
              <option value="900L-1100L">900L – 1100L (High School)</option>
              <option value="1100L-1300L">1100L – 1300L (HS/College)</option>
              <option value="1300L+">1300L+ (College/Adult)</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Age Range</label>
            <select className="lx-input text-sm" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
              <option value="">N/A</option>
              <option value="5-8">Ages 5–8 (Early Reader)</option>
              <option value="9-12">Ages 9–12 (Middle Grade)</option>
              <option value="13-15">Ages 13–15 (Young Teen)</option>
              <option value="16-18">Ages 16–18 (Young Adult)</option>
              <option value="18+">Ages 18+ (Adult)</option>
            </select>
          </div>
        </div>

        <button onClick={generateBook} className="lx-btn-primary w-full justify-center">
          <Sparkles size={16} /> Create My Book
        </button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Text only · No images · PG-13 content filtered · Saved to your library</p>
      </div>
    );
  }

  // GENERATING PHASE
  if (phase === 'generating') {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--lx-accent)' }} />
        </div>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Creating your book...</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{bookSpec?.title}</p>

        <div className="rounded-full h-2 mb-2 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--lx-accent)' }} />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {progress.current < progress.total
            ? `Writing chapter ${progress.current + 1} of ${progress.total}: ${progress.title}`
            : 'Finalizing your book...'}
        </p>
      </div>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && book) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={true} onClick={() => {}} icon={Plus} label="Create" />
          <TabButton active={false} onClick={() => { setFromLibrary(false); setView('library'); }} icon={Library} label="My Books" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <BookResult
            book={book}
            onStartOver={startOver}
            onBackToLibrary={fromLibrary ? () => { setFromLibrary(false); setView('library'); } : undefined}
          />
        </div>
      </div>
    );
  }

  return null;
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--lx-accent)' : 'transparent',
        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
      }}>
      <Icon size={14} /> {label}
    </button>
  );
}