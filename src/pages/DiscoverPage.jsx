import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, TrendingUp, BookOpen, Film } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks, FALLBACK_TRENDING } from '@/lib/googleBooks';
import BookGrid from '@/components/books/BookGrid';
import { useAuth } from '@/lib/AuthContext';
import NetflixRow from '@/components/discover/NetflixRow';
import LoadMoreRecommendations from '@/components/discover/LoadMoreRecommendations';
import CantFindBookPrompt from '@/components/discover/CantFindBookPrompt';
import { searchMovies, getTrendingMovies, getTopRatedMovies, getMovieRecommendations } from '@/lib/tmdb';
import MovieGrid from '@/components/movies/MovieGrid';
import MovieRecommendations from '@/components/movies/MovieRecommendations';
import BookCard from '@/components/books/BookCard';
import MovieCard from '@/components/movies/MovieCard';
import { getVocab } from '@/lib/vocab';

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



function interleave(books, movies, ratio) {
  if (!books.length && !movies.length) return [];
  const target = Math.max(0, Math.min(1, ratio / 100));
  const res = [];
  let bi = 0, mi = 0;
  const total = books.length + movies.length;
  for (let i = 0; i < total; i++) {
    const bookDef = bi < books.length ? target - (bi / (i || 1)) : -2;
    const movieDef = mi < movies.length ? (1 - target) - (mi / (i || 1)) : -2;
    const pickBook = mi >= movies.length ? true : (bi >= books.length ? false : bookDef >= movieDef);
    if (pickBook && bi < books.length) res.push({ type: 'book', data: books[bi++] });
    else if (mi < movies.length) res.push({ type: 'movie', data: movies[mi++] });
    else if (bi < books.length) res.push({ type: 'book', data: books[bi++] });
  }
  return res;
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
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [trendingEmpty, setTrendingEmpty] = useState(false);
  const [userPrefs, setUserPrefs] = useState(null);
  const [netflixSeeds, setNetflixSeeds] = useState([]);
  const [contentMode, setContentMode] = useState('books');
  const v = getVocab(contentMode);
  const [viewMode, setViewMode] = useState('both');
  const [contentRatio, setContentRatio] = useState(50);
  const ratioTimer = useRef(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [movieResults, setMovieResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('all');
  const [forYouMovies, setForYouMovies] = useState([]);

  useEffect(() => {
    if (user?.email) {
      loadSaved();
      base44.entities.UserPreferences.filter({ user_email: user.email }).then(p => {
        if (p[0]) {
          setShowPopular(p[0].show_popular !== false);
          setUserPrefs(p[0]);
          setContentMode(p[0].content_mode || 'books');
          setContentRatio(p[0].content_ratio != null ? p[0].content_ratio : 50);
          if ((p[0].content_mode || 'books') !== 'books') {
            getTrendingMovies().then(setTrendingMovies).catch(() => {});
            getTopRatedMovies().then(setTopRatedMovies).catch(() => {});
            getMovieRecommendations(p[0]).then(setForYouMovies).catch(() => {});
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
    setSearchFilter('all');
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

  function saveRatio(value) {
    clearTimeout(ratioTimer.current);
    ratioTimer.current = setTimeout(async () => {
      try {
        if (userPrefs?.id) {
          await base44.entities.UserPreferences.update(userPrefs.id, { content_ratio: value });
        } else if (user?.email) {
          const np = await base44.entities.UserPreferences.create({ user_email: user.email, content_ratio: value });
          setUserPrefs(np);
        }
      } catch (e) {}
    }, 600);
  }

  const showBookResults = searchResults.length > 0 && (searchFilter === 'all' || searchFilter === 'book');
  const showMovieResults = movieResults.length > 0 && (searchFilter === 'all' || searchFilter === 'movie');
  const topBooks = searchResults.slice(0, 2);
  const topMovies = movieResults.slice(0, 2);
  const forYouMixed = useMemo(() => interleave(forYouBooks, forYouMovies, contentRatio), [forYouBooks, forYouMovies, contentRatio]);

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
            AI-powered {v.nounPlural} discovery that learns your taste. Create an account for personalized recommendations.
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
            placeholder={v.searchPlaceholder}
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

      {!searching && !searchError && hasSearched && searchResults.length === 0 && movieResults.length === 0 && (
        <section className="mb-12">
          <div className="lx-card p-8 text-center">
            <Search size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {v.noResults} for "{searchQuery}"
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Try checking the spelling, or use fewer words. You can also search by author name.
            </p>
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setMovieResults([]); setHasSearched(false); }} className="lx-btn-ghost text-sm">Clear Search</button>
            <CantFindBookPrompt contentMode={contentMode} />
          </div>
        </section>
      )}

      {!searching && !searchError && hasSearched && (searchResults.length > 0 || movieResults.length > 0) && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Results for "{searchQuery}"
            </h2>
            <div className="flex items-center gap-2">
              {contentMode === 'books_movies' && (
                <div className="flex gap-1">
                  {[['all', 'All'], ['book', 'Books'], ['movie', 'Movies']].map(([val, label]) => (
                    <button key={val} onClick={() => setSearchFilter(val)}
                      className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                      style={{ background: searchFilter === val ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: searchFilter === val ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${searchFilter === val ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setSearchResults([]); setMovieResults([]); setHasSearched(false); setSearchQuery(''); setSearchFilter('all'); }} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Clear
              </button>
            </div>
          </div>

          {contentMode === 'books_movies' && searchFilter === 'all' && (topBooks.length + topMovies.length) > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Top Results</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {topBooks.map((b, i) => (
                  <BookCard key={`tb${i}`} book={b} onSave={saveBook} isSaved={savedIds.includes(b.google_books_id || b.id)} />
                ))}
                {topMovies.map((m, i) => (
                  <MovieCard key={`tm${i}`} movie={m} onSave={saveMovie} isSaved={savedIds.includes(m.tmdb_id || m.id)} />
                ))}
              </div>
            </div>
          )}

          {showBookResults && (
            <div className="mb-6">
              {contentMode === 'books_movies' && <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>📚 Books</p>}
              <BookGrid books={searchResults} onSave={saveBook} savedIds={savedIds} />
            </div>
          )}

          {showMovieResults && (
            <div className="mb-6">
              {contentMode === 'books_movies' && <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>🎬 Movies</p>}
              <MovieGrid movies={movieResults} onSave={saveMovie} savedIds={savedIds} />
            </div>
          )}

          <CantFindBookPrompt contentMode={contentMode} />
        </section>
      )}

      {/* Books↔Movies controls (books+movies mode only) */}
      {contentMode === 'books_movies' && (
        <div className="mb-8 lx-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1">
            {[['books', 'Books', BookOpen], ['both', 'Both', Film], ['movies', 'Movies', Film]].map(([val, label, Ic]) => (
              <button key={val} onClick={() => setViewMode(val)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{ background: viewMode === val ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: viewMode === val ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${viewMode === val ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                <Ic size={12} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Books</span>
            <input type="range" min={0} max={100} value={contentRatio}
              onChange={(e) => { const val = Number(e.target.value); setContentRatio(val); saveRatio(val); }}
              className="flex-1" style={{ accentColor: 'var(--lx-accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Movies</span>
            <span className="text-xs font-mono w-12 text-right" style={{ color: 'var(--text-secondary)' }}>{contentRatio}/100</span>
          </div>
        </div>
      )}

      {/* Netflix-style "Because you liked" rows */}
      {isAuthenticated && contentMode !== 'movies' && viewMode !== 'movies' && netflixSeeds.length > 0 && netflixSeeds.map((seed, i) => (
        <NetflixRow key={seed.title + i} seed={seed} onSave={saveBook} savedIds={savedIds} />
      ))}

      {/* For You */}
      {isAuthenticated && (contentMode === 'books' || (contentMode === 'books_movies' && viewMode === 'books')) && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: 'var(--lx-accent)' }} />
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>For You</h2>
          </div>
          <BookGrid books={forYouBooks} onSave={saveBook} savedIds={savedIds} />
          <LoadMoreRecommendations userPrefs={userPrefs} onSave={saveBook} savedIds={savedIds} />
        </section>
      )}

      {isAuthenticated && contentMode === 'books_movies' && viewMode === 'both' && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: 'var(--lx-accent)' }} />
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>For You</h2>
          </div>
          {forYouMixed.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {forYouMixed.map((item, idx) => item.type === 'book'
                ? <BookCard key={`fb${idx}`} book={item.data} onSave={saveBook} isSaved={savedIds.includes(item.data.google_books_id || item.data.id)} />
                : <MovieCard key={`fm${idx}`} movie={item.data} onSave={saveMovie} isSaved={savedIds.includes(item.data.tmdb_id || item.data.id)} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded animate-pulse" style={{ aspectRatio: '2/3', background: 'var(--bg-card)' }} />
              ))}
            </div>
          )}
          <LoadMoreRecommendations userPrefs={userPrefs} onSave={saveBook} savedIds={savedIds} />
        </section>
      )}

      {/* Trending */}
      {showPopular && contentMode !== 'movies' && viewMode !== 'movies' && (
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

      {contentMode !== 'books' && viewMode !== 'books' && trendingMovies.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIES</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trending Movies</h2>
          </div>
          <MovieGrid movies={trendingMovies} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}

      {contentMode !== 'books' && viewMode !== 'books' && topRatedMovies.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>MOVIES</span>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Top Rated Movies</h2>
          </div>
          <MovieGrid movies={topRatedMovies} onSave={saveMovie} savedIds={savedIds} />
        </section>
      )}

      {isAuthenticated && (contentMode === 'movies' || (contentMode === 'books_movies' && viewMode === 'movies')) && (
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