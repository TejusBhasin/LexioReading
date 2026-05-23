import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import { getBookById, searchBooks, getAmazonUrl } from '@/lib/googleBooks';
import AppLayout from '@/components/layout/AppLayout';
import BookGrid from '@/components/books/BookGrid';
import { Bookmark, ShoppingCart, Star, Sparkles, ChevronLeft, ExternalLink, BookOpen, Zap } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: '📖 Want to Read' },
  { value: 'reading', label: '🔖 Currently Reading' },
  { value: 'finished', label: '✅ Finished' },
  { value: 'dropped', label: '💔 Dropped' },
];

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useLexioAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [whyThis, setWhyThis] = useState('');
  const [whyLoading, setWhyLoading] = useState(false);
  const [moreLike, setMoreLike] = useState([]);
  const [moreLoading, setMoreLoading] = useState(false);
  const [libraryItem, setLibraryItem] = useState(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    loadBook();
    if (user) loadLibraryStatus();
  }, [id, user]);

  async function loadBook() {
    setLoading(true);
    try {
      const data = await getBookById(id);
      setBook(data);
      generateAiSummary(data);
      if (user) generateWhyThis(data);
    } catch (err) {
      setBook(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadLibraryStatus() {
    const items = await base44.entities.UserLibrary.filter({ user_email: user.email, book_id: id });
    if (items.length > 0) setLibraryItem(items[0]);
  }

  async function generateAiSummary(b) {
    if (!b) return;
    setSummaryLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a compelling 3-sentence summary of the book "${b.title}" by ${b.author}. Be insightful, not just descriptive. Highlight what makes it special and who it's best for. Keep it punchy and reader-focused.`,
      });
      setAiSummary(result);
    } catch {}
    setSummaryLoading(false);
  }

  async function generateWhyThis(b) {
    if (!b || !user) return;
    setWhyLoading(true);
    try {
      const prefsArr = await base44.entities.UserPreferences.filter({ user_email: user.email });
      const prefs = prefsArr[0] || {};
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Why would a reader with these preferences enjoy "${b.title}" by ${b.author}?
Preferences: genres=${(prefs.favorite_genres||[]).join(',')}, moods=${(prefs.moods||[]).join(',')}, pacing=${prefs.pacing}
Write 2 sentences max. Be specific and personal. Start with "This book matches you because..."`,
      });
      setWhyThis(result);
    } catch {}
    setWhyLoading(false);
  }

  async function loadMoreLike() {
    if (!book) return;
    setMoreLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `List 6 books similar to "${book.title}" by ${book.author}. Return JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: { type: 'object', properties: { title: { type: 'string' }, author: { type: 'string' } } }
            }
          }
        }
      });
      const similar = [];
      for (const b of (result.books || []).slice(0, 6)) {
        const results = await searchBooks(`${b.title} ${b.author}`, 1);
        if (results.length > 0) similar.push(results[0]);
        else similar.push({ title: b.title, author: b.author, google_books_id: null });
      }
      setMoreLike(similar);
    } catch {}
    setMoreLoading(false);
  }

  async function addToLibrary(status) {
    if (!user) { navigate('/signup'); return; }
    if (libraryItem) {
      await base44.entities.UserLibrary.update(libraryItem.id, { status });
      setLibraryItem(prev => ({ ...prev, status }));
    } else {
      const item = await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: id,
        book_title: book.title,
        book_author: book.author,
        book_cover: book.cover_image,
        status,
        date_added: new Date().toISOString(),
      });
      setLibraryItem(item);
    }
    setStatusMenuOpen(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded-lg" style={{ background: 'var(--bg-card)' }} />
            <div className="flex gap-8">
              <div className="w-48 h-72 rounded-xl" style={{ background: 'var(--bg-card)' }} />
              <div className="flex-1 space-y-4">
                <div className="h-10 rounded-lg" style={{ background: 'var(--bg-card)' }} />
                <div className="h-6 w-48 rounded-lg" style={{ background: 'var(--bg-card)' }} />
                <div className="h-32 rounded-xl" style={{ background: 'var(--bg-card)' }} />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!book) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Book not found</p>
          <Link to="/" className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>← Back to Discover</Link>
        </div>
      </AppLayout>
    );
  }

  const amazonUrl = book.amazon_search_url || getAmazonUrl(book.title, book.author);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Hero */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          {/* Cover */}
          <div className="shrink-0">
            <div
              className="w-40 sm:w-48 h-60 sm:h-72 rounded-2xl overflow-hidden mx-auto sm:mx-0"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              {book.cover_image ? (
                <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {(book.categories || []).slice(0, 3).map(cat => (
                <span key={cat} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--bg-card)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                  {cat}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
              {book.title}
            </h1>
            <p className="text-lg mb-3" style={{ color: 'var(--text-secondary)' }}>by {book.author}</p>

            {book.average_rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={14} style={{ color: 'var(--accent-primary)' }} fill={book.average_rating >= n ? 'currentColor' : 'none'} />
                ))}
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{book.average_rating.toFixed(1)}</span>
              </div>
            )}

            {book.page_count > 0 && (
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {book.page_count} pages · {book.published_date?.slice(0, 4) || 'Unknown year'}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Library button */}
              <div className="relative">
                <button
                  onClick={() => user ? setStatusMenuOpen(!statusMenuOpen) : navigate('/signup')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all"
                  style={{
                    background: libraryItem ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: libraryItem ? '#000' : 'var(--text-primary)',
                    border: '2px solid ' + (libraryItem ? 'var(--accent-primary)' : 'var(--border-color)'),
                  }}
                >
                  <Bookmark size={16} fill={libraryItem ? 'currentColor' : 'none'} />
                  {libraryItem ? STATUS_OPTIONS.find(s => s.value === libraryItem.status)?.label : 'Add to Library'}
                </button>
                {statusMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 z-10 rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', minWidth: '200px' }}>
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => addToLibrary(opt.value)}
                        className="w-full px-4 py-3 text-sm font-medium text-left transition-all hover:opacity-80"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amazon */}
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all"
                style={{ background: '#FF9900', color: '#000' }}
              >
                <ShoppingCart size={16} />
                Buy on Amazon
              </a>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <section className="mb-8 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>AI Summary</h2>
          </div>
          {summaryLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-hover)', width: `${80 + i * 5}%` }} />)}
            </div>
          ) : (
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiSummary || book.description}</p>
          )}
        </section>

        {/* Why this book? */}
        {user && (
          <section className="mb-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--accent-primary)20, var(--bg-card))', border: '1px solid var(--accent-primary)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Why This Book For You</h2>
            </div>
            {whyLoading ? (
              <div className="h-12 rounded animate-pulse" style={{ background: 'var(--bg-hover)' }} />
            ) : (
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{whyThis || 'Generating personalized insight...'}</p>
            )}
          </section>
        )}

        {/* Description */}
        {book.description && (
          <section className="mb-8">
            <h2 className="font-black text-xl mb-4" style={{ color: 'var(--text-primary)' }}>About This Book</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {book.description.length > 600 ? book.description.slice(0, 600) + '...' : book.description}
            </p>
          </section>
        )}

        {/* More Like This */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>More Like This</h2>
            {moreLike.length === 0 && (
              <button
                onClick={loadMoreLike}
                disabled={moreLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'var(--accent-primary)', color: '#000', opacity: moreLoading ? 0.7 : 1 }}
              >
                <Sparkles size={14} />
                {moreLoading ? 'Finding similar...' : 'Find Similar Books'}
              </button>
            )}
          </div>
          {moreLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />)}
            </div>
          ) : (
            <BookGrid books={moreLike} savedIds={savedIds} />
          )}
        </section>
      </div>
    </AppLayout>
  );
}