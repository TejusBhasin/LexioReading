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

      // Build queries from user taste
      const queries = [];
      seeds.forEach(s => queries.push(`"${s}" similar 2022`));
      genres.forEach(g => queries.push(`${g} bestseller 202${2 + (page % 3)}`));
      themes.forEach(t => queries.push(`${t} fiction novel 2022`));

      // Fallback queries if nothing personalized
      if (queries.length === 0) {
        queries.push('bestseller fiction 2023', 'mystery thriller novel 2022', 'science fiction 2023');
      }

      const shuffled = queries.sort(() => Math.random() - 0.5).slice(0, 4);
      const results = await Promise.all(shuffled.map(q => searchBooks(q, 8).catch(() => [])));
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