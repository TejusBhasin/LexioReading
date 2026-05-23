import React from 'react';
import BookCard from './BookCard';

export default function BookGrid({ books, onSave, savedIds = [], showHook = true, columns = 'default' }) {
  const gridClass = columns === 'compact'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5';

  if (!books?.length) return null;

  return (
    <div className={gridClass}>
      {books.map((book, i) => (
        <BookCard
          key={book.google_books_id || book.id || i}
          book={book}
          onSave={onSave}
          isSaved={savedIds.includes(book.google_books_id || book.id)}
          showHook={showHook}
        />
      ))}
    </div>
  );
}