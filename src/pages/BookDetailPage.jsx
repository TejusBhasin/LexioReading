import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Sparkles, RefreshCw, PenSquare, Share2, Trash2, Clock, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getBookById, searchBooks } from '@/lib/googleBooks';
import { useAuth } from '@/lib/AuthContext';
import BookGrid from '@/components/books/BookGrid';
import ReviewCard from '@/components/reviews/ReviewCard';
import WriteReviewModal from '@/components/reviews/WriteReviewModal';
import UsernameSetupModal from '@/components/user/UsernameSetupModal';
import DiscussionForum from '@/components/discussions/DiscussionForum';
import StarRating from '@/components/reviews/StarRating';
import AgeVerificationModal from '@/components/books/AgeVerificationModal';
import { cleanHtml } from '@/utils/textClean';

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
  { value: 'dropped', label: 'Dropped' },
];

export default function BookDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [similar, setSimilar] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [ageInfo, setAgeInfo] = useState(null);

  useEffect(() => {
    loadBook();
    loadReviews();
    if (user?.email) { loadLibraryEntry(); loadUserProfile(); }
  }, [id, user]);

  async function loadUserProfile() {
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) setUserProfile(p.find(x => x.username) || p[0]);
    } catch (e) {}
  }

  async function loadReviews() {
    try {
      const r = await base44.entities.Review.filter({ book_id: id }, '-created_date', 20);
      setReviews(r);
    } catch (e) {}
  }

  function handleWriteReview() {
    if (!isAuthenticated) { navigate('/signup'); return; }
    if (!userProfile?.username) { setShowUsernameModal(true); return; }
    setShowWriteModal(true);
  }

  async function loadBook() {
    setLoading(true);
    try {
      const b = await getBookById(id);
      if (b && b.title) {
        setBook(b);
        generateAISummary(b);
        // Track this click for trending (fire-and-forget)
        if (user?.email) {
          base44.entities.BookClick.create({
            book_id: id,
            book_title: b.title,
            book_author: b.author,
            book_cover: b.cover_image || '',
          }).catch(() => {});
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadLibraryEntry() {
    try {
      const entries = await base44.entities.UserLibrary.filter({ user_email: user.email, book_id: id });
      if (entries.length > 0) {
        setLibraryEntry(entries[0]);
        setNotes(entries[0].notes || '');
        setCurrentPage(entries[0].current_page ? String(entries[0].current_page) : '');
      }
      const lib = await base44.entities.UserLibrary.filter({ user_email: user.email });
      setSavedIds(lib.map(l => l.book_id));
    } catch (e) {}
  }

  async function loadAgeInfo(b) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `For the book "${b.title}" by ${b.author}, provide:
1. recommended_age: the minimum recommended age (e.g. "12+", "14+", "16+", "18+", "All ages")
2. lexile_level: the approximate Lexile reading level as a number (e.g. 800 for typical 7th grade)
3. lexile_label: a short label like "GN730L" or "800L" or an approximate range
4. content_notes: very brief note on any mature content (e.g. "mild violence", "clean", "some adult themes")
Use your knowledge of this book.`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommended_age: { type: 'string' },
            lexile_level: { type: 'number' },
            lexile_label: { type: 'string' },
            content_notes: { type: 'string' },
          }
        }
      });
      setAgeInfo(result);
    } catch (e) {}
  }

  async function generateAISummary(b) {
    if (!b) return;
    setLoadingSummary(true);
    loadAgeInfo(b);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a compelling, spoiler-free 3-sentence summary of "${b.title}" by ${b.author}. 
Make it feel like a knowledgeable friend recommending it — enthusiastic but honest.
Also write one "hook line" (max 15 words) that captures the book's essence.

Context: ${b.description?.slice(0, 500) || 'No description available'}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            hook: { type: 'string' },
          }
        }
      });
      if (result?.summary) setAiSummary(result.summary);
      if (result?.hook) setAiReasoning(result.hook);
    } catch (e) {}
    setLoadingSummary(false);
  }

  async function addToLibrary(status) {
    if (!user) { navigate('/login'); return; }
    // Optimistic update
    setLibraryEntry(prev => prev ? { ...prev, status } : { status, book_id: id });
    try {
      if (libraryEntry) {
        const updated = await base44.entities.UserLibrary.update(libraryEntry.id, { status });
        setLibraryEntry(updated);
      } else {
        const entry = await base44.entities.UserLibrary.create({
          user_email: user.email,
          book_id: id,
          book_title: book.title,
          book_author: book.author,
          book_cover: book.cover_image,
          status,
          date_added: new Date().toISOString(),
        });
        setLibraryEntry(entry);
        setSavedIds(prev => [...prev, id]);
      }
    } catch (e) {}
  }

  async function loadSimilar() {
    if (!book) return;
    setLoadingSimilar(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `List exactly 5 books that are very similar to "${book.title}" by ${book.author}. 
These should be books for the same audience and genre. Do NOT include the original book.
Return a JSON object with a "books" array, each item having "title" and "author" fields.`,
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
                }
              }
            }
          }
        }
      });

      // Handle both wrapped {books:[]} and raw array responses
      const aiBooks = Array.isArray(result) ? result : (result?.books || []);
      if (aiBooks.length === 0) { setLoadingSimilar(false); return; }

      const fetched = await Promise.all(
        aiBooks.slice(0, 5).map(b =>
          searchBooks(`"${b.title}" ${b.author}`, 3)
            .then(results => {
              // Pick the result whose title most closely matches
              const exact = results.find(r => r.title?.toLowerCase().includes(b.title.toLowerCase()));
              return exact || results[0] || null;
            })
            .catch(() => null)
        )
      );
      const valid = fetched.filter(b => b && b.cover_image && b.title !== book.title);
      setSimilar(valid);
    } catch (e) {}
    setLoadingSimilar(false);
  }

  async function saveBook(b) {
    if (!user) { navigate('/signup'); return; }
    const bookId = b.google_books_id || b.id;
    if (savedIds.includes(bookId)) return;
    try {
      await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: bookId,
        book_title: b.title,
        book_author: b.author,
        book_cover: b.cover_image,
        status: 'want_to_read',
        date_added: new Date().toISOString(),
      });
      setSavedIds(prev => [...prev, bookId]);
    } catch (e) {}
  }

  async function removeFromLibrary() {
    if (!libraryEntry?.id) return;
    if (!confirm('Remove this book from your library?')) return;
    await base44.entities.UserLibrary.delete(libraryEntry.id);
    setLibraryEntry(null);
    setSavedIds(prev => prev.filter(sid => sid !== id));
    setNotes('');
    setCurrentPage('');
  }

  async function updateRating(rating) {
    if (!user) { navigate('/login'); return; }
    if (libraryEntry?.id) {
      const updated = await base44.entities.UserLibrary.update(libraryEntry.id, { rating });
      setLibraryEntry(updated);
    } else {
      const entry = await base44.entities.UserLibrary.create({
        user_email: user.email, book_id: id, book_title: book.title,
        book_author: book.author, book_cover: book.cover_image,
        status: 'want_to_read', rating, date_added: new Date().toISOString(),
      });
      setLibraryEntry(entry);
      setSavedIds(prev => [...prev, id]);
    }
    // Trigger AI taste analysis (fire-and-forget)
    base44.functions.invoke('analyzeUserActivity', {
      user_email: user.email,
      activity_type: 'rating',
      book_title: book?.title,
      book_author: book?.author,
      rating,
    }).catch(() => {});
  }

  async function saveNotes() {
    if (!libraryEntry?.id) return;
    await base44.entities.UserLibrary.update(libraryEntry.id, {
      notes,
      current_page: currentPage ? parseInt(currentPage) : null,
    });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  function shareBook() {
    try {
      navigator.clipboard.writeText(window.location.href);
      setShareMsg('Copied!');
    } catch (e) {
      setShareMsg('Copy URL manually');
    }
    setTimeout(() => setShareMsg(''), 2500);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Book not found.</p>
        <Link to="/" className="lx-btn-ghost mt-4 inline-flex">← Back</Link>
      </div>
    );
  }

  const amazonUrl = book.amazon_search_url || `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="lx-btn-ghost text-sm mb-6 py-1.5 px-3">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Cover */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-40 md:w-52 rounded-lg"
              style={{ boxShadow: 'var(--shadow-card)' }}
            />
          ) : (
            <div className="w-40 md:w-52 rounded-lg flex items-center justify-center text-center p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', aspectRatio: '2/3' }}>
              <span className="font-display text-xl font-bold" style={{ color: 'var(--lx-accent)' }}>{book.title}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {book.categories?.map(cat => (
              <span key={cat} className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                {cat}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h1>
          <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>by {book.author}</p>

          <div className="flex items-center gap-4 mb-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
            {book.published_date && <span>{book.published_date.slice(0, 4)}</span>}
            {book.page_count > 0 && <span>{book.page_count} pages</span>}
            {book.page_count > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> ~{Math.ceil(book.page_count / 60)}h read
              </span>
            )}
            {book.average_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={13} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />
                {book.average_rating.toFixed(1)}
              </span>
            )}
            {ageInfo?.recommended_age && (
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--lx-accent)' }}>
                Ages {ageInfo.recommended_age}
              </span>
            )}
            {ageInfo?.lexile_label && (
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Lexile: {ageInfo.lexile_label}
              </span>
            )}
            {ageInfo?.content_notes && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                · {ageInfo.content_notes}
              </span>
            )}
          </div>

          {/* AI Hook */}
          {aiReasoning && (
            <div className="mb-4 px-4 py-3 rounded-lg" style={{ background: 'var(--bg-elevated)', borderLeft: '3px solid var(--lx-accent)' }}>
              <p className="italic text-sm" style={{ color: 'var(--text-secondary)' }}>"{aiReasoning}"</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mb-6">
            {/* Status + remove */}
            <div className="flex gap-1 flex-wrap items-center">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => addToLibrary(opt.value)}
                  className="text-xs px-3 py-1.5 rounded font-medium transition-all"
                  style={{
                    background: libraryEntry?.status === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                    color: libraryEntry?.status === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${libraryEntry?.status === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {libraryEntry?.id && (
                <button onClick={removeFromLibrary} title="Remove from library"
                  className="text-xs px-2.5 py-1.5 rounded transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            {/* Star rating */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Your rating:</span>
                <div className="flex gap-0.5 items-center">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => updateRating(star)} className="transition-transform hover:scale-110">
                      <Star size={18}
                        fill={star <= (libraryEntry?.rating || 0) ? 'var(--lx-accent)' : 'transparent'}
                        style={{ color: 'var(--lx-accent)' }} />
                    </button>
                  ))}
                  {(libraryEntry?.rating || 0) > 0 && (
                    <button onClick={() => updateRating(0)} className="ml-1" style={{ color: 'var(--text-muted)' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Page progress */}
            {libraryEntry?.status === 'reading' && book.page_count > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page:</span>
                <input type="number" min="0" max={book.page_count}
                  className="lx-input text-xs"
                  style={{ width: '72px' }}
                  placeholder="Current"
                  value={currentPage}
                  onChange={e => setCurrentPage(e.target.value)}
                  onBlur={saveNotes}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>of {book.page_count}</span>
                {currentPage && parseInt(currentPage) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(parseInt(currentPage)/book.page_count*100))}%`, background: 'var(--lx-accent)' }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>
                      {Math.round(parseInt(currentPage)/book.page_count*100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Buttons row */}
            <div className="flex flex-wrap gap-2">
              <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="lx-btn-primary text-sm py-1.5">
                <ShoppingCart size={13} /> Buy on Amazon
              </a>
              <button onClick={shareBook} className="lx-btn-ghost text-sm py-1.5">
                <Share2 size={13} /> {shareMsg || 'Share'}
              </button>
              {libraryEntry?.status === 'reading' && (
                <Link to="/reading-log" className="lx-btn-ghost text-sm py-1.5">
                  <Clock size={13} /> Log Session
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
              {cleanHtml(book.description)}
            </p>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-10 p-6 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            AI Summary
          </h2>
        </div>
        {loadingSummary ? (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
            <span className="text-sm">Generating summary...</span>
          </div>
        ) : aiSummary ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cleanHtml(aiSummary)}</p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {cleanHtml(book.description?.slice(0, 400)) || 'No description available.'}
          </p>
        )}
      </div>

      {/* Personal Notes */}
      {isAuthenticated && libraryEntry?.id && (
        <div className="mb-10 p-6 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <PenSquare size={16} style={{ color: 'var(--lx-accent)' }} /> My Notes
          </h2>
          <textarea
            className="lx-input resize-none text-sm"
            rows={3}
            placeholder="Private notes, quotes, or thoughts about this book..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button onClick={saveNotes} className="lx-btn-ghost text-xs py-1.5 mt-2">
            {noteSaved ? '✓ Saved' : 'Save Notes'}
          </button>
        </div>
      )}

      {/* Reviews */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Star size={16} style={{ color: 'var(--lx-accent)' }} />
            Reviews
            {reviews.length > 0 && (
              <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                ({reviews.length}) · {(reviews.reduce((s,r) => s+(r.rating||0), 0)/reviews.length).toFixed(1)} avg
              </span>
            )}
          </h2>
          <button onClick={handleWriteReview} className="lx-btn-primary text-xs py-1.5">
            <PenSquare size={12} /> Write Review
          </button>
        </div>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map(r => <ReviewCard key={r.id} review={r} user={user} />)}
          </div>
        ) : (
          <div className="lx-card p-6 text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
            <button onClick={handleWriteReview} className="lx-btn-primary text-sm">Be the first to review</button>
          </div>
        )}
      </div>

      {/* Discussion */}
      <div className="mb-10">
        <DiscussionForum bookId={id} bookTitle={book?.title} />
      </div>

      {/* More like this */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            More like this
          </h2>
          {similar.length === 0 && (
            <button
              onClick={loadSimilar}
              disabled={loadingSimilar}
              className="lx-btn-ghost text-sm py-1.5"
            >
              <RefreshCw size={13} className={loadingSimilar ? 'animate-spin' : ''} />
              {loadingSimilar ? 'Finding...' : 'Find similar'}
            </button>
          )}
        </div>

        {similar.length > 0 ? (
          <BookGrid books={similar} onSave={saveBook} savedIds={savedIds} showHook={false} />
        ) : !loadingSimilar && (
          <div className="py-10 rounded-lg text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--lx-border)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Discover books similar to this one</p>
            <button onClick={loadSimilar} className="lx-btn-primary text-sm">
              Find Similar Books
            </button>
          </div>
        )}
      </div>

      {showUsernameModal && user && (
        <UsernameSetupModal
          user={user}
          onComplete={p => { setUserProfile(p); setShowUsernameModal(false); setShowWriteModal(true); }}
          onClose={() => setShowUsernameModal(false)}
        />
      )}

      {showWriteModal && book && userProfile && user && (
        <WriteReviewModal
          book={book}
          username={userProfile.username}
          userEmail={user.email}
          onClose={() => setShowWriteModal(false)}
          onSubmitted={() => { setShowWriteModal(false); loadReviews(); }}
        />
      )}

      {showAgeModal && user && (
        <AgeVerificationModal
          user={user}
          onVerified={() => { setAgeVerified(true); setShowAgeModal(false); }}
          onClose={() => navigate(-1)}
        />
      )}
    </div>
  );
}