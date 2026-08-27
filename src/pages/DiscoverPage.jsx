import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks, FALLBACK_TRENDING } from '@/lib/googleBooks';
import BookGrid from '@/components/books/BookGrid';
import { useAuth } from '@/lib/AuthContext';
import NetflixRow from '@/components/discover/NetflixRow';
import LoadMoreRecommendations from '@/components/discover/LoadMoreRecommendations';
import CantFindBookPrompt from '@/components/discover/CantFindBookPrompt';
import { searchMovies, getTrendingMovies, getTopRatedMovies } from '@/lib/tmdb';
import MovieGrid from '@/components/movies/MovieGrid';
import MovieRecommendations from '@/components/movies/MovieRecommendations';

const GENRE_FILTERS = ['All', 'Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Historical', 'Thriller', 'Non-Fiction'];

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
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [trendingEmpty, setTrendingEmpty] = useState(false);
  const [userPrefs, setUserPrefs] = useState(null);
  const [netflixSeeds, setNetflixSeeds] = useState([]);
  const [contentMode, setContentMode] = useState('books');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [movieResults, setMovieResults] = useState([]);

  useEffect(() => {
    if (user?.email) {
      loadSaved();
      base44.entities.UserPreferences.filter({ user_email: user.email }).then(p => {
        if (p[0]) {
          setShowPopular(p[0].show_popular !== false);
          setUserPrefs(p[0]);
          setContentMode(p[0].content_mode || 'books');
          if ((p[0].content_mode || 'books') !== 'books') {
            getTrendingMovies().then(setTrendingMovies).catch(() => {});
            getTopRatedMovies().then(setTopRatedMovies).catch(() => {});
          }
          // Build Netflix seeds from AI recommendation seeds + finished books
          const seeds = (p[0].ai_recommendation_seeds || []).slice(0, 3).map(title => ({ title }));
          setNetflixSeeds(seeds);
        }
      }).catch(() => {});
      // Also check finished books as seeds
      base44.entities.UserLibrary.filter({ user_email: user.email, status: 'finished' }, '-updated_date', 5).then(lib => {
        if (lib.length > 0) {
          setNetflixSeeds(prev => {
            const existing = new Set(prev.map(s => s.title?.toLowerCase()));
            const newSeeds = lib.filter(b => !existing.has(b.book_title?.toLowerCase())).slice(0, 3).map(b => ({ title: b.book_title, author: b.book_author }));
            return [...prev, ...newSeeds].slice(0, 3);
          });
        }
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
    const pool = allResults.flat().filter(b => b?.cover_image && b.published_date >= '2020');
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
    setSearchError('');
    setHasSearched(true);
    try {
      if (contentMode !== 'movies') {
        const results = await searchBooks(searchQuery, 12);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
      if (contentMode !== 'books') {
        const movies = await searchMovies(searchQuery, 12);
        setMovieResults(movies);
      } else {
        setMovieResults([]);
      }
    } catch (e) {
      setSearchResults([]);
      setMovieResults([]);
      setSearchError(e.message || 'Search failed. Please try again.');
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

  async function saveMovie(movie) {
    if (!user) {
      window.location.href = '/signup';
      return;
    }
    const movieId = movie.tmdb_id || movie.id;
    if (savedIds.includes(movieId)) return;
    try {
      await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: movieId,
        book_title: movie.title,
        book_author: movie.director || '',
        book_cover: movie.cover_image,
        media_type: 'movie',
        status: 'want_to_read',
        date_added: new Date().toISOString(),
      });
      setSavedIds(prev => [...prev, movieId]);
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
            placeholder="Search by title, author, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="lx-btn-primary px-5" disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      {searching && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Searching for "{searchQuery}"...
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded animate-pulse" style={{ aspectRatio: '2/3', background: 'var(--bg-card)' }} />
            ))}
          </div>
        </section>
      )}

      {!searching && searchError && (
        <section className="mb-12">
          <div className="lx-card p-8 text-center">
            <Search size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{searchError}</p>
            <button onClick={() => handleSearch({ preventDefault: () => {} })} className="lx-btn-ghost text-sm mt-3">Try Again</button>
          </div>
        </section>
      )}

      {!searching && !searchError && hasSearched && searchResults.length === 0 && (
        <section className="mb-12">
          <div className="lx-card p-8 text-center">
            <Search size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              No results for "{searchQuery}"
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Try checking the spelling, or use fewer words. You can also search by author name.
            </p>
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setMovieResults([]); setHasSearched(false); }} className="lx-btn-ghost text-sm">Clear Search</button>
            <CantFindBookPrompt />
          </div>
        </section>
      )}

      {!searching && searchResults.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Results for "{searchQuery}"
            </h2>
            <button onClick={() => { setSearchResults([]); setMovieResults([]); setHasSearched(false); }} className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Clear
            </button>
          </div>
          <BookGrid books={searchResults} onSave={saveBook} savedIds={savedIds} />
          <CantFindBookPrompt />
        </section>
      )}

      {!searching && movieResults.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIE</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Movies for "{searchQuery}"
            </h2>
          </div>
          <MovieGrid movies={movieResults} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}

      {/* Netflix-style "Because you liked" rows */}
      {isAuthenticated && contentMode !== 'movies' && netflixSeeds.length > 0 && netflixSeeds.map((seed, i) => (
        <NetflixRow key={seed.title + i} seed={seed} onSave={saveBook} savedIds={savedIds} />
      ))}

      {/* For You */}
      {isAuthenticated && contentMode !== 'movies' && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: 'var(--lx-accent)' }} />
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>For You</h2>
          </div>
          <BookGrid books={forYouBooks} onSave={saveBook} savedIds={savedIds} />
          <LoadMoreRecommendations userPrefs={userPrefs} onSave={saveBook} savedIds={savedIds} />
        </section>
      )}

      {/* Trending */}
      {showPopular && contentMode !== 'movies' && (
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

      {contentMode !== 'books' && trendingMovies.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIES</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trending Movies</h2>
          </div>
          <MovieGrid movies={trendingMovies} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}

      {contentMode !== 'books' && topRatedMovies.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIES</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Top Rated Movies</h2>
          </div>
          <MovieGrid movies={topRatedMovies} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}

      {contentMode !== 'books' && isAuthenticated && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIES</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Movies For You</h2>
          </div>
          <MovieRecommendations userPrefs={userPrefs} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}
    </div>
  );
}