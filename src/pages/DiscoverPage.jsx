import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks, FALLBACK_TRENDING } from '@/lib/googleBooks';
import BookGrid from '@/components/books/BookGrid';
import { useAuth } from '@/lib/AuthContext';

const TRENDING_QUERIES = ['bestseller 2024', 'science fiction award winner', 'mystery thriller', 'literary fiction', 'fantasy epic'];
const GENRE_FILTERS = ['All', 'Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Historical', 'Thriller', 'Non-Fiction'];

const FOR_YOU_QUERIES = [
  'funny teen comedy novel', 'humorous middle grade fiction', 'laugh out loud young adult',
  'cozy fantasy adventure', 'magical school wizards teens', 'epic quest fantasy young adult',
  'sci-fi adventure teens robots', 'space exploration young adult science fiction',
  'heartwarming coming of age story', 'feel good romance teens', 'summer love teen fiction',
  'friendship adventure middle school', 'mystery puzzle solving teens',
  'sports championship underdog teen', 'music band teens young adult',
  'time travel adventure teens', 'animal adventure heartwarming', 'road trip teens friends',
  'small town mystery teens', 'art creativity teen fiction', 'gaming virtual reality teens',
  'superhero powers teens', 'detective mystery young adult', 'food cooking teen fiction',
  'dance performance teens novel', 'theater drama high school fiction',
  'ocean marine biology adventure teens', 'camping wilderness survival teens',
  'positive mindset self improvement teens', 'science experiment discovery teens',
  'math competition academic teens fiction', 'debate speech team teens novel',
  'photography art teen coming of age', 'baking food truck teens fiction',
  'volunteering community teens feel good', 'travel abroad exchange student teens',
  'garden nature healing teens fiction', 'coding startup teens young adult',
  'environmental activism teens hopeful', 'historical adventure brave teens',
  'mythology retelling teens fun', 'fairy tale retelling young adult',
  'heist clever funny teens', 'game show competition teens novel',
  'pen pal letters teens friendship', 'new school friendship fresh start teens',
];

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
    const pool = allResults.flat().filter(b => b?.cover_image);
    const unique = Object.values(Object.fromEntries(pool.map(b => [b.google_books_id || b.title, b])));
    const randomSix = [...unique].sort(() => Math.random() - 0.5).slice(0, 6);
    setForYouBooks(randomSix);
  }

  async function loadFeatured() {
    setLoading(true);
    try {
      const query = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
      const books = await searchBooks(query, 20);
      const filtered = books.filter(b => b.cover_image && b.published_date && b.published_date >= '2020');
      setFeaturedBooks(filtered.length >= 4 ? filtered : FALLBACK_TRENDING);
    } catch (e) {
      setFeaturedBooks(FALLBACK_TRENDING);
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
          <div className="flex flex-wrap gap-2 mb-5">
            {GENRE_FILTERS.map(g => (
              <button key={g} onClick={() => setActiveGenre(g)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: activeGenre === g ? 'var(--lx-accent)' : 'var(--bg-card)',
                  color: activeGenre === g ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--lx-border)'
                }}>{g}</button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded" style={{ aspectRatio: '2/3', background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <BookGrid
              books={activeGenre === 'All' ? featuredBooks : featuredBooks.filter(b => (b.categories || []).some(c => c.toLowerCase().includes(activeGenre.toLowerCase())))}
              onSave={saveBook}
              savedIds={savedIds}
            />
          )}
        </section>
      )}
    </div>
  );
}