import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks, FALLBACK_TRENDING } from '@/lib/googleBooks';
import BookGrid from '@/components/books/BookGrid';
import { useAuth } from '@/lib/AuthContext';

const GENRE_FILTERS = ['All', 'Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Historical', 'Thriller', 'Non-Fiction'];

// Banned words — any query or book title/description containing these is filtered out
const BANNED_WORDS = ['teen', 'teenager', 'young adult', 'ya fiction', 'middle grade', 'children', 'kids', 'abuse', 'war', 'romance', 'self help', 'self-help', 'adult content', 'explicit'];

const FOR_YOU_QUERIES = [
  'bestselling literary fiction 2022', 'award winning mystery novel 2023',
  'gripping thriller bestseller 2023', 'epic fantasy series acclaimed',
  'science fiction bestseller 2022 space', 'cozy mystery detective novel 2023',
  'page turning crime novel 2022', 'inspiring memoir 2023',
  'popular biography 2022', 'popular science fascinating 2023',
  'dystopian fiction critically acclaimed 2022', 'magical realism bestseller 2022',
  'historical fiction acclaimed 2022', 'adventure travel story 2023',
  'acclaimed debut novel 2022', 'best book club fiction 2023',
  'philosophy ideas popular 2022', 'contemporary fiction drama 2023',
  'spy espionage thriller 2022', 'cultural history fascinating 2023',
  'nature writing 2023', 'short story collection acclaimed 2022',
  'heist clever novel 2022', 'time travel science fiction 2023',
  'mythology retelling fiction 2022', 'gothic fiction 2023',
  'comedy satire novel 2022', 'translated international bestseller 2023',
  'detective noir mystery 2022', 'climate future science fiction 2023',
];

function isSafeBook(book) {
  const text = `${book.title} ${book.author} ${(book.categories || []).join(' ')}`.toLowerCase();
  return !BANNED_WORDS.some(w => text.includes(w));
}

export default function DiscoverPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [forYouBooks, setForYouBooks] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [trendingEmpty, setTrendingEmpty] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadSaved();
      base44.entities.UserPreferences.filter({ user_email: user.email }).then(p => {
        if (p[0]) setShowPopular(p[0].show_popular !== false);
      }).catch(() => {});
    }
    loadFeatured();
    loadForYouBooks();
  }, [user]);

  async function loadForYouBooks() {
    const shuffled = [...FOR_YOU_QUERIES].sort(() => Math.random() - 0.5);
    const selectedQueries = shuffled.slice(0, 4);
    const allResults = await Promise.all(
      selectedQueries.map(q => searchBooks(q, 10).catch(() => []))
    );
    const pool = allResults.flat().filter(b => b?.cover_image && isSafeBook(b) && b.published_date >= '2020');
    const unique = Object.values(Object.fromEntries(pool.map(b => [b.google_books_id || b.title, b])));
    const randomSix = [...unique].sort(() => Math.random() - 0.5).slice(0, 6);
    setForYouBooks(randomSix);
  }

  async function loadFeatured() {
    setLoading(true);
    try {
      // Use real click data — top 10 most-clicked books by all users
      const clicks = await base44.entities.BookClick.list('-created_date', 500);
      // Count clicks per book_id
      const counts = {};
      const meta = {};
      clicks.forEach(c => {
        if (!c.book_id) return;
        counts[c.book_id] = (counts[c.book_id] || 0) + 1;
        if (!meta[c.book_id]) meta[c.book_id] = c;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (sorted.length >= 4) {
        const trendingBooks = sorted.map(([book_id, count]) => {
          const m = meta[book_id];
          return { google_books_id: book_id, id: book_id, title: m.book_title, author: m.book_author, cover_image: m.book_cover, clickCount: count };
        }).filter(b => b.title && b.cover_image);
        if (trendingBooks.length >= 4) {
          setFeaturedBooks(trendingBooks);
          setLoading(false);
          return;
        }
      }
      // Not enough real data yet — show placeholder message
      setFeaturedBooks([]);
      setTrendingEmpty(true);
    } catch (e) {
      setFeaturedBooks([]);
      setTrendingEmpty(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadSaved() {
    try {
      const lib = await base44.entities.UserLibrary.filter({ user_email: user.email });
      setSavedIds(lib.map(l => l.book_id));
    } catch (e) {}
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const profileMatch = searchQuery.trim().match(/^\/u\/(.+)$/i);
    if (profileMatch) {
      navigate(`/u/${profileMatch[1].trim()}`);
      return;
    }
    setSearching(true);
    try {
      const results = await searchBooks(searchQuery, 12);
      setSearchResults(results.filter(b => b.cover_image));
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function saveBook(book) {
    if (!user) {
      window.location.href = '/signup';
      return;
    }
    const bookId = book.google_books_id || book.id;
    if (savedIds.includes(bookId)) return;
    try {
      await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: bookId,
        book_title: book.title,
        book_author: book.author,
        book_cover: book.cover_image,
        status: 'want_to_read',
        date_added: new Date().toISOString(),
      });
      setSavedIds(prev => [...prev, bookId]);
    } catch (e) {}
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Hero */}
      {!isAuthenticated && (
        <div className="mb-12 py-10 px-6 rounded-lg text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <div className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            Demo Mode
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Find your next<br />
            <span style={{ color: 'var(--lx-accent)' }}>obsession.</span>
          </h1>
          <p className="text-lg mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            AI-powered book discovery that learns your taste. Create an account for personalized recommendations.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup" className="lx-btn-primary py-3 px-6 text-base">
              Get Started Free <Sparkles size={16} />
            </Link>
            <Link to="/login" className="lx-btn-ghost py-3 px-6 text-base">
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            className="lx-input pl-10"
            placeholder=""
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="lx-btn-primary px-5" disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Results for "{searchQuery}"
            </h2>
            <button onClick={() => setSearchResults([])} className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Clear
            </button>
          </div>
          <BookGrid books={searchResults} onSave={saveBook} savedIds={savedIds} />
        </section>
      )}

      {/* For You */}
      {isAuthenticated && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: 'var(--lx-accent)' }} />
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>For You</h2>
          </div>
          <BookGrid books={forYouBooks} onSave={saveBook} savedIds={savedIds} />
        </section>
      )}

      {/* Trending */}
      {showPopular && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color: 'var(--lx-accent)' }} />
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trending</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded" style={{ aspectRatio: '2/3', background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : trendingEmpty || featuredBooks.length === 0 ? (
            <div className="lx-card p-10 text-center">
              <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Trending books will appear here as people explore and click on books. Check back soon!
              </p>
            </div>
          ) : (
            <BookGrid
              books={featuredBooks}
              onSave={saveBook}
              savedIds={savedIds}
            />
          )}
        </section>
      )}
    </div>
  );
}