import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Search, TrendingUp, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks } from '@/lib/googleBooks';
import { SAMPLE_BOOKS } from '@/lib/theme';
import BookGrid from '@/components/books/BookGrid';
import { useAuth } from '@/lib/AuthContext';

const TRENDING_QUERIES = ['bestseller 2024', 'science fiction award winner', 'mystery thriller', 'literary fiction', 'fantasy epic'];

export default function DiscoverPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [genRec, setGenRec] = useState(false);
  const [showRecs, setShowRecs] = useState(true);
  const [showPopular, setShowPopular] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadSaved();
      loadRecommendations();
      base44.entities.UserPreferences.filter({ user_email: user.email }).then(p => {
        if (p[0]) {
          setShowRecs(p[0].show_recommendations !== false);
          setShowPopular(p[0].show_popular !== false);
        }
      }).catch(() => {});
    }
    loadFeatured();
  }, [user]);

  async function loadFeatured() {
    setLoading(true);
    try {
      const query = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
      const books = await searchBooks(query, 10);
      setFeaturedBooks(books.filter(b => b.cover_image));
    } catch (e) {
      setFeaturedBooks(SAMPLE_BOOKS);
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

  async function loadRecommendations() {
    try {
      const recs = await base44.entities.Recommendation.filter(
        { user_email: user.email, dismissed: false },
        '-created_date',
        8
      );
      setRecommendations(recs);
    } catch (e) {}
  }

  async function generateRecommendations() {
    if (!user) return;
    setGenRec(true);
    try {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      const p = prefs[0] || {};
      const lib = await base44.entities.UserLibrary.filter({ user_email: user.email });
      const finishedBooks = lib.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 5);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a book recommendation AI for Lexio. Generate 6 personalized book recommendations.

User preferences:
- Favorite genres: ${(p.favorite_genres || []).join(', ') || 'not set'}
- Favorite books: ${(p.favorite_books || []).join(', ') || 'not set'}
- Moods: ${(p.moods || []).join(', ') || 'not set'}
- Pacing preference: ${p.pacing || 'any'}
- Dislikes: ${(p.disliked_content || []).join(', ') || 'none'}
- Recently finished: ${finishedBooks.join(', ') || 'none yet'}

Return exactly 6 recommendations in this JSON format. Each must be a real, published book.`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  book_title: { type: 'string' },
                  book_author: { type: 'string' },
                  reasoning: { type: 'string' },
                  hook: { type: 'string' },
                  book_categories: { type: 'array', items: { type: 'string' } },
                }
              }
            }
          }
        },
        model: 'claude_sonnet_4_6'
      });

      const recs = result?.recommendations || [];

      // Fetch covers and save
      for (const rec of recs) {
        try {
          const books = await searchBooks(`${rec.book_title} ${rec.book_author}`, 1);
          const cover = books[0]?.cover_image || null;
          const bookId = books[0]?.google_books_id || rec.book_title.replace(/\s+/g, '-').toLowerCase();

          await base44.entities.Recommendation.create({
            user_email: user.email,
            book_id: bookId,
            book_title: rec.book_title,
            book_author: rec.book_author,
            book_cover: cover,
            book_categories: rec.book_categories || [],
            reasoning: rec.reasoning,
            hook: rec.hook,
            source: 'auto',
            dismissed: false,
          });
        } catch (e) {}
      }

      await loadRecommendations();
    } catch (e) {
      console.error(e);
    } finally {
      setGenRec(false);
      if (!result?.recommendations?.length) {
        console.error('No recommendations returned');
      }
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="lx-input pl-9"
            placeholder="Search books by title, author, or genre..."
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

      {/* AI Recommendations */}
      {isAuthenticated && showRecs && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: 'var(--lx-accent)' }} />
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                For You
              </h2>
            </div>
            <button
              onClick={generateRecommendations}
              disabled={genRec}
              className="lx-btn-ghost text-sm py-1.5"
            >
              <RefreshCw size={13} className={genRec ? 'animate-spin' : ''} />
              {genRec ? 'Thinking...' : 'Refresh'}
            </button>
          </div>

          {recommendations.length > 0 ? (
            <BookGrid books={recommendations} onSave={saveBook} savedIds={savedIds} />
          ) : (
            <div
              className="py-10 rounded-lg text-center"
              style={{ background: 'var(--bg-card)', border: '1px dashed var(--lx-border)' }}
            >
              <Sparkles size={24} className="mx-auto mb-3" style={{ color: 'var(--lx-accent)' }} />
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>No recommendations yet</p>
              <button onClick={generateRecommendations} disabled={genRec} className="lx-btn-primary">
                {genRec ? 'Generating...' : 'Generate Recommendations'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Trending */}
      {showPopular && <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Trending
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded" style={{ aspectRatio: '2/3', background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <BookGrid books={featuredBooks} onSave={saveBook} savedIds={savedIds} />
        )}
      </section>}
    </div>
  );
}