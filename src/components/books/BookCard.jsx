import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookmarkCheck } from 'lucide-react';

export default function BookCard({ book, onSave, isSaved, showHook = true }) {
  const cover = book.cover_image || book.book_cover;
  const title = book.title || book.book_title;
  const author = book.author || book.book_author;
  const hook = book.ai_hook || book.hook;

  return (
    <div className="lx-card group flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      {/* Cover */}
      <Link to={`/book/${book.google_books_id || book.book_id || book.id}`} className="block flex-shrink-0">
        <div className="relative overflow-hidden w-full" style={{ paddingBottom: '150%' }}>
          {cover ? (
            <img
              src={cover}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="absolute inset-0 items-center justify-center text-center p-3"
            style={{ background: 'var(--bg-elevated)', display: cover ? 'none' : 'flex' }}
          >
            <span className="font-display text-sm font-bold leading-tight" style={{ color: 'var(--lx-accent)' }}>
              {title}
            </span>
          </div>
          {/* Category badge */}
          {(book.categories || book.book_categories)?.length > 0 && (
            <div className="absolute top-2 left-2 right-2">
              <span
                className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded max-w-full truncate"
                style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--lx-accent)', backdropFilter: 'blur(4px)' }}
              >
                {(book.categories || book.book_categories)[0]}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1 min-h-0">
        <Link to={`/book/${book.google_books_id || book.book_id || book.id}`} className="block">
          <h3 className="font-bold text-xs leading-snug line-clamp-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </Link>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{author}</p>

        {showHook && hook && (
          <p className="text-xs mt-1 line-clamp-2 italic leading-snug" style={{ color: 'var(--text-secondary)' }}>
            "{hook}"
          </p>
        )}

        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); onSave(book); }}
            className="mt-auto pt-2 flex items-center gap-1 text-xs font-semibold transition-all"
            style={{ color: isSaved ? 'var(--lx-accent)' : 'var(--text-muted)' }}
          >
            {isSaved ? <BookmarkCheck size={12} /> : <Plus size={12} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}