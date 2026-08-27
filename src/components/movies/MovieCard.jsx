import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookmarkCheck, Play } from 'lucide-react';

export default function MovieCard({ movie, onSave, isSaved }) {
  const cover = movie.cover_image;
  const title = movie.title || movie.book_title;
  const id = movie.tmdb_id || movie.id || movie.book_id;

  return (
    <div className="lx-card group flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      <Link to={`/movie/${id}`} className="block flex-shrink-0">
        <div className="relative overflow-hidden w-full" style={{ paddingBottom: '150%' }}>
          {cover ? (
            <img
              src={cover}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-center p-3"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <span className="font-display text-sm font-bold leading-tight" style={{ color: 'var(--lx-accent)' }}>
                {title}
              </span>
            </div>
          )}
          {/* Red YouTube-like play button to indicate a movie */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ background: '#e50914', boxShadow: '0 2px 10px rgba(0,0,0,0.55)' }}
            >
              <Play size={20} fill="white" style={{ color: 'white', marginLeft: 3 }} />
            </div>
          </div>
          {movie.average_rating ? (
            <span
              className="absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.75)', color: '#e8c547', backdropFilter: 'blur(4px)' }}
            >
              ★ {movie.average_rating}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-2.5 gap-1 min-h-0">
        <Link to={`/movie/${id}`} className="block">
          <h3 className="font-bold text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </Link>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {movie.release_year || ''}{movie.runtime ? ` · ${movie.runtime}m` : ''}
        </p>

        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); onSave(movie); }}
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