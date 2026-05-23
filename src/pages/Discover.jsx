import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import { searchBooks, searchByCategory } from '@/lib/googleBooks';
import AppLayout from '@/components/layout/AppLayout';
import BookGrid from '@/components/books/BookGrid';
import { Search, Sparkles, TrendingUp, Zap, Lock } from 'lucide-react';

const DEMO_BOOKS = [
  { google_books_id: 'demo1', title: 'The Name of the Wind', author: 'Patrick Rothfuss', cover_image: 'https://books.google.com/books/content?id=HMtBOAAACAAJ&printsec=frontcover&img=1&zoom=3', ai_hook: 'A legendary story of magic, music, and a man who became a myth.', categories: ['Fantasy'] },
  { google_books_id: 'demo2', title: 'Project Hail Mary', author: 'Andy Weir', cover_image: 'https://books.google.com/books/content?id=rkA0EAAAQBAJ&printsec=frontcover&img=1&zoom=3', ai_hook: 'One astronaut. Alone in space. The fate of Earth in his hands.', categories: ['Sci-Fi'] },
  { google_books_id: 'demo3', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', cover_image: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=3', ai_hook: 'Why do smart people make terrible decisions? The answer will change you.', categories: ['Psychology'] },
  { google_books_id: 'demo4', title: 'The Road', author: 'Cormac McCarthy', cover_image: 'https://books.google.com/books/content?id=PfmjWho_jOYC&printsec=frontcover&img=1&zoom=3', ai_hook: 'A father and son walking through a burned America. Devastating and beautiful.', categories: ['Literary Fiction'] },
];

const CATEGORIES = ['fiction', 'science fiction', 'mystery thriller', 'biography', 'self-help', 'fantasy', 'historical fiction', 'psychology'];

export default function Discover() {
  const { user } = useLexioAuth();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('fiction');
  const [savedIds, setSavedIds] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    loadCategoryBooks(activeCategory);
    if (user) {
      loadSaved();
      loadRecommendations();
    }
  }, [user, activeCategory]);

  async function loadCategoryBooks(cat) {
    setLoading(true);
    try {
      const results = await searchByCategory(cat, 20);
      setBooks(results);
    } catch {
      setBooks(DEMO_BOOKS);
    } finally {
      setLoading(false);
    }
  }

  async function loadSaved() {
    const items = await base44.entities.UserLibrary.filter({ user_email: user.email });
    setSavedIds(items.map(i => i.book_id));
  }

  async function loadRecommendations() {
    setRecsLoading(true);
    try {
      const recs = await base44.entities.Recommendation.filter({ user_email: user.email, is_dismissed: false });
      if (recs.length > 0) {
        setRecommendations(recs.slice(0, 6));
      } else {
        await generateRecommendations();
      }
    } catch {
      setRecsLoading(false);
    } finally {
      setRecsLoading(false);
    }
  }

  async function generateRecommendations() {
    if (!user) return;
    setRecsLoading(true);
    try {
      const prefsArr = await base44.entities.UserPreferences.filter({ user_email: user.email });
      const prefs = prefsArr[0] || {};
      const libraryItems = await base44.entities.UserLibrary.filter({ user_email: user.email });

      const prompt = `You are a book recommendation AI. Generate 6 personalized book recommendations.
User preferences:
- Favorite genres: ${(prefs.favorite_genres || []).join(', ') || 'Not specified'}
- Moods: ${(prefs.moods || []).join(', ') || 'Not specified'}
- Pacing: ${prefs.pacing || 'any'}
- Difficulty: ${prefs.difficulty || 'any'}
- Disliked genres: ${(prefs.disliked_genres || []).join(', ') || 'None'}
- Favorite books: ${(prefs.favorite_books || []).join(', ') || 'Not specified'}
- Books in library: ${libraryItems.map(b => b.book_title).join(', ') || 'None yet'}

Return JSON with exactly 6 books, each with: title, author, reason (one sentence explaining why this matches the user), hook (a punchy one-liner about the book), categories (array of strings).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  author: { type: 'string' },
                  reason: { type: 'string' },
                  hook: { type: 'string' },
                  categories: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });

      const recBooks = result.books || [];
      const saved = [];
      for (const book of recBooks) {
        // Try to get cover from Google Books
        let cover = null;
        try {
          const gbResults = await searchBooks(`${book.title} ${book.author}`, 1);
          if (gbResults.length > 0) cover = gbResults[0].cover_image;
        } catch {}

        const rec = await base44.entities.Recommendation.create({
          user_email: user.email,
          book_title: book.title,
          book_author: book.author,
          book_cover: cover,
          reason: book.reason,
          source: 'ai_engine',
        });
        saved.push({ ...rec, ai_hook: book.hook });
      }
      setRecommendations(saved);
    } catch (err) {
      console.error('Rec error:', err);
    } finally {
      setRecsLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchBooks(query, 20);
      setBooks(results);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(book) {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const id = book.google_books_id || book.id;
    if (savedIds.includes(id)) return;

    await base44.entities.UserLibrary.create({
      user_email: user.email,
      book_id: id,
      book_title: book.title,
      book_author: book.author,
      book_cover: book.cover_image,
      status: 'want_to_read',
      date_added: new Date().toISOString(),
    });
    setSavedIds(prev => [...prev, id]);
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Demo banner */}
        {!user && (
          <div className="mb-8 p-4 rounded-xl flex items-center justify-between gap-4" style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-primary)' }}>
            <div className="flex items-center gap-3">
              <Lock size={18} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Demo Mode</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sign up for AI recommendations, chat, and library tracking.</p>
              </div>
            </div>
            <Link to="/signup" className="px-4 py-2 rounded-lg text-sm font-black whitespace-nowrap" style={{ background: 'var(--accent-primary)', color: '#000' }}>
              Get full access
            </Link>
          </div>
        )}

        {/* Hero / Search */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Discover your<br />
            <span style={{ color: 'var(--accent-primary)' }}>next obsession.</span>
          </h1>
          <p className="text-lg mb-8 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            AI-powered recommendations that actually know your taste.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search any book, author, or topic..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '2px solid var(--border-color)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-4 rounded-xl font-black text-sm"
              style={{ background: 'var(--accent-primary)', color: '#000' }}
            >
              Search
            </button>
          </form>
        </div>

        {/* AI Recommendations */}
        {user && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>For You</h2>
              </div>
              <button
                onClick={generateRecommendations}
                disabled={recsLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
                {recsLoading ? 'Thinking...' : 'Refresh'}
              </button>
            </div>
            {recsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
                ))}
              </div>
            ) : (
              <BookGrid
                books={recommendations.map(r => ({
                  ...r,
                  google_books_id: r.google_books_id || r.id,
                  title: r.book_title,
                  author: r.book_author,
                  cover_image: r.book_cover,
                }))}
                onSave={handleSave}
                savedIds={savedIds}
                showReason
              />
            )}
          </section>
        )}

        {/* Category filter */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: activeCategory === cat ? '#000' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Books grid */}
        <section>
          <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
              ))}
            </div>
          ) : (
            <BookGrid books={user ? books : DEMO_BOOKS} onSave={handleSave} savedIds={savedIds} />
          )}
        </section>
      </div>
    </AppLayout>
  );
}