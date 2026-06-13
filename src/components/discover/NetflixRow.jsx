import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchBooks } from '@/lib/googleBooks';
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
      // Fetch similar books AND author books in parallel
      const genre = seed.genre || 'fiction';
      const [similar, byAuthor] = await Promise.all([
        searchBooks(`subject:${genre} books similar to "${seed.title}"`, 6),
        seed.author ? searchBooks(`inauthor:"${seed.author}" -intitle:"${seed.title}"`, 4) : Promise.resolve([]),
      ]);
      // Deduplicate and filter out the seed itself
      const all = [...similar, ...byAuthor].filter(b =>
        b.cover_image && b.title?.toLowerCase() !== seed.title?.toLowerCase()
      );
      const unique = Object.values(Object.fromEntries(all.map(b => [b.google_books_id || b.title, b])));
      setBooks(unique.slice(0, 8));
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
            <div key={book.google_books_id || book.title} className="flex-shrink-0 w-28">
              <BookCard book={book} onSave={onSave} saved={savedIds?.includes(book.google_books_id)} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}