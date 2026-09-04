import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { searchBooks } from '@/lib/googleBooks';
import { base44 } from '@/api/base44Client';
import BookCard from '@/components/books/BookCard';

// Netflix-style "Because you liked X" row
export default function NetflixRow({ seed, onSave, savedIds }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seed?.title) load();
  }, [seed?.title]);

  async function load() {
    setLoading(true);
    try {
      // Use AI to recommend 2 genuinely similar books
      const res = await base44.functions.invoke('similarBookPair', {
        title: seed.title,
        author: seed.author,
      });
      const recs = res.data?.recommendations || [];
      // Fetch each recommended book from Google Books to get covers & metadata
      const results = await Promise.all(
        recs.map(async (rec) => {
          try {
            const found = await searchBooks(`${rec.title} ${rec.author}`, 2);
            const match = found.find(b =>
              b.title?.toLowerCase().includes(rec.title.toLowerCase().split(':')[0].trim()) ||
              rec.title.toLowerCase().includes(b.title?.toLowerCase().split(':')[0].trim() || '')
            ) || found[0];
            return match ? { ...match, recommendation_reason: rec.reason } : null;
          } catch (e) { return null; }
        })
      );
      const valid = results.filter(b => b?.cover_image && b.title?.toLowerCase() !== seed.title?.toLowerCase());
      setBooks(valid);
    } catch (e) {}
    setLoading(false);
  }

  if (!seed || (!loading && books.length === 0)) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--lx-accent)' }}>
            Because you liked
          </p>
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {seed.title}
            {seed.author && <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>by {seed.author}</span>}
          </h3>
        </div>
        <button onClick={load} disabled={loading} title="Refresh" className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28 rounded" style={{ aspectRatio: '2/3', background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {books.map(book => (
            <div key={book.google_books_id || book.title} className="flex-shrink-0 w-36">
              <BookCard book={book} onSave={onSave} saved={savedIds?.includes(book.google_books_id)} />
              {book.recommendation_reason && (
                <p className="text-xs mt-1.5 italic leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {book.recommendation_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}