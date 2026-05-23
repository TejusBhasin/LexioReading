import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookmarkCheck } from 'lucide-react';

export default function BookCard({ book, onSave, isSaved, showHook = true }) {
  const cover = book.cover_image || book.book_cover;
  const title = book.title || book.book_title;
  const author = book.author || book.book_author;
  const hook = book.ai_hook || book.hook;

  return (
    <div className="lx-card group flex flex-col overflow-hidden">
      {/* Cover */}
      <Link to={`/book/${book.google_books_id || book.book_id || book.id}`} className="block">
        <div className="relative overflow-hidden" style={{ paddingBottom: '150%' }}>
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div
            className="absolute inset-0 items-center justify-center text-center p-4 hidden"
            style={{ background: 'var(--bg-elevated)', display: cover ? 'none' : 'flex' }}
          >
            <span className="font-display text-lg font-bold" style={{ color: 'var(--lx-accent)' }}>
              {title}
            </span>
          </div>
          {/* Category badge */}
          {(book.categories || book.book_categories)?.length > 0 && (
            <div className="absolute top-2 left-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-primary)', color: 'var(--lx-accent)', opacity: 0.95 }}
              >
                {(book.categories || book.book_categories)[0]}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <Link to={`/book/${book.google_books_id || book.book_id || book.id}`}>
          <h3 className="font-bold text-sm leading-tight line-clamp-2 hover:lx-accent transition-colors" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </Link>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{author}</p>

        {showHook && hook && (
          <p className="text-xs mt-1 line-clamp-2 italic" style={{ color: 'var(--text-secondary)' }}>
            "{hook}"
          </p>
        )}

        {onSave && (
          <button
            onClick={() => onSave(book)}
            className="mt-auto pt-2 flex items-center gap-1 text-xs font-semibold transition-all"
            style={{ color: isSaved ? 'var(--lx-accent)' : 'var(--text-muted)' }}
          >
            {isSaved ? <BookmarkCheck size={13} /> : <Plus size={13} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}