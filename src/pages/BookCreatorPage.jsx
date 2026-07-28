import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { buildOutlinePrompt, buildChapterPrompt, OUTLINE_SCHEMA, calcChapterCount, countWords } from '@/lib/bookCreator';
import BookChat from '@/components/bookcreator/BookChat';
import BookResult from '@/components/bookcreator/BookResult';
import BookLibrary from '@/components/bookcreator/BookLibrary';
import { Feather, ArrowLeft, Sparkles, Loader2, Library, Plus } from 'lucide-react';

export default function BookCreatorPage() {
  const { user } = useAuth();
  const [view, setView] = useState('create');
  const [phase, setPhase] = useState('chat');
  const [bookSpec, setBookSpec] = useState(null);
  const [book, setBook] = useState(null);
  const [fromLibrary, setFromLibrary] = useState(false);
  const [pageCount, setPageCount] = useState(50);
  const [useMinPages, setUseMinPages] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, title: '' });
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.email) { setChecking(false); return; }
    base44.entities.UserProfile.filter({ user_email: user.email })
      .then((profiles) => {
        setAuthorName(profiles[0]?.username || user.email.split('@')[0]);
      }).catch(() => {}).finally(() => setChecking(false));
  }, [user]);

  async function generateBook() {
    setPhase('generating');
    setError('');
    const chapterCount = calcChapterCount(pageCount);
    const wordsPerChapter = Math.round((pageCount * 280) / chapterCount);

    try {
      const outlineResult = await base44.integrations.Core.InvokeLLM({
        prompt: buildOutlinePrompt(bookSpec, chapterCount, wordsPerChapter),
        response_json_schema: OUTLINE_SCHEMA,
      });
      const outline = typeof outlineResult === 'string' ? JSON.parse(outlineResult) : outlineResult;
      const chapters = outline.chapters || [];
      if (chapters.length === 0) throw new Error('No chapters generated');

      setProgress({ current: 0, total: chapters.length, title: chapters[0]?.title || '' });
      const generated = [];

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const prevEnding = generated.length > 0
          ? generated[generated.length - 1].content.split('\n').filter(l => l.trim()).slice(-2).join(' ')
          : '';
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: buildChapterPrompt(bookSpec, ch, i + 1, chapters.length, wordsPerChapter, prevEnding),
        });
        const text = typeof result === 'string' ? result : String(result);
        generated.push({ title: ch.title, content: text });
        setProgress({ current: i + 1, total: chapters.length, title: ch.title });
      }

      const finalBook = { title: bookSpec.title, author: authorName || 'Anonymous', chapters: generated };
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
          genre: bookSpec.genre || '',
          description: bookSpec.description || '',
          book_file_url: file_url,
          chapter_count: finalBook.chapters.length,
          word_count: countWords(finalBook.chapters),
          page_count: Math.round(countWords(finalBook.chapters) / 280),
        });
      } catch (e) {}
    } catch (e) {
      setError(e.message || 'Failed to generate book. Please try again.');
      setPhase('confirm');
    }
  }

  function startOver() {
    setPhase('chat');
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

  // CHAT PHASE
  if (phase === 'chat') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <TabButton active={true} onClick={() => {}} icon={Plus} label="Create" />
          <TabButton active={false} onClick={() => setView('library')} icon={Library} label="My Books" />
        </div>
        <div className="px-4 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
          <Feather size={18} style={{ color: 'var(--lx-accent)' }} />
          <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Custom Book Creator</h1>
        </div>
        <div className="flex-1 min-h-0">
          <BookChat onBookReady={(spec) => { setBookSpec(spec); setPhase('confirm'); }} />
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