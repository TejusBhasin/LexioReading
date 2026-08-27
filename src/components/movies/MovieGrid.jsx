import React from 'react';
import MovieCard from './MovieCard';

export default function MovieGrid({ movies, onSave, savedIds = [] }) {
  const all = movies || [];
  if (!all.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {all.map((m, i) => (
        <MovieCard
          key={m.tmdb_id || m.id || i}
          movie={m}
          onSave={onSave}
          isSaved={savedIds.includes(m.tmdb_id || m.id)}
        />
      ))}
    </div>
  );
}