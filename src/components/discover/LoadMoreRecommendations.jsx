import React, { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { searchBooks } from '@/lib/googleBooks';
import BookGrid from '@/components/books/BookGrid';

const BANNED_WORDS = ['teen', 'teenager', 'young adult', 'ya fiction', 'middle grade', 'children', 'kids', 'abuse', 'war', 'romance', 'self help', 'self-help'];

function isSafe(book) {
  const text = `${book.title} ${book.author} ${(book.categories || []).join(' ')}`.toLowerCase();
  return !BANNED_WORDS.some(w => text.includes(w));
}

export default function LoadMoreRecommendations({ userPrefs, onSave, savedIds }) {
  const [moreBooks, setMoreBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  async function loadMore() {
    setLoading(true);
    try {
      const seeds = userPrefs?.ai_recommendation_seeds || [];
      const genres = userPrefs?.ai_favorite_genres || [];
      const themes = userPrefs?.ai_preferred_themes || [];
      const year = 2022 + (page % 4);

      // Build queries from user taste — use formats that work well with Google Books
      const queries = [];
      seeds.forEach(s => queries.push(`intitle:${s}`));
      genres.forEach(g => queries.push(`subject:${g} bestseller ${year}`));
      themes.forEach(t => queries.push(`${t} novel ${year}`));

      // Always include fallback queries so there's variety even with prefs
      queries.push('bestselling fiction ' + year, 'award winning novel ' + year, 'acclaimed mystery thriller ' + year, 'popular science fiction ' + year);

      // Pick 4 random queries, ensuring at least 2 are fallbacks
      const personal = queries.filter((_, i) => i < queries.length - 4);
      const fallbacks = queries.slice(-4);
      const picked = [
        ...personal.sort(() => Math.random() - 0.5).slice(0, 2),
        ...fallbacks.sort(() => Math.random() - 0.5).slice(0, 2),
      ];

      const results = await Promise.all(picked.map(q => searchBooks(q, 10).catch(() => [])));
      const pool = results.flat().filter(b => b.cover_image && isSafe(b) && b.published_date >= '2020');
      const unique = Object.values(Object.fromEntries(pool.map(b => [b.google_books_id || b.title, b])));
      const fresh = unique.filter(b => !savedIds?.includes(b.google_books_id));
      setMoreBooks(prev => {
        const combined = [...prev, ...fresh];
        return Object.values(Object.fromEntries(combined.map(b => [b.google_books_id || b.title, b]))).slice(0, (page + 1) * 6);
      });
      setPage(p => p + 1);
    } catch (e) {}
    setLoading(false);
  }

  return (
    <div className="mt-4">
      {moreBooks.length > 0 && (
        <div className="mb-5">
          <BookGrid books={moreBooks} onSave={onSave} savedIds={savedIds} />
        </div>
      )}
      <div className="text-center">
        <button
          onClick={loadMore}
          disabled={loading}
          className="lx-btn-primary text-sm"
        >
          {loading ? (
            <><RefreshCw size={14} className="animate-spin" /> Finding more...</>
          ) : (
            <><Sparkles size={14} /> {moreBooks.length === 0 ? 'Generate More Recommendations' : 'Load Even More'}</>
          )}
        </button>
      </div>
    </div>
  );
}