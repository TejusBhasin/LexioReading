import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { getMovieRecommendations } from '@/lib/tmdb';
import MovieGrid from '@/components/movies/MovieGrid';

// AI-driven "Movies For You" — suggests titles from the user's prefs, resolves via TMDB.
export default function MovieRecommendations({ userPrefs, onSave, savedIds }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const recs = await getMovieRecommendations(userPrefs);
      setMovies(recs);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mt-4">
      {movies.length > 0 && (
        <div className="mb-5">
          <MovieGrid movies={movies} onSave={onSave} savedIds={savedIds} />
        </div>
      )}
      <div className="text-center">
        <button onClick={load} disabled={loading} className="lx-btn-primary text-sm">
          {loading ? (
            <><RefreshCw size={14} className="animate-spin" /> Finding movies...</>
          ) : (
            <><Sparkles size={14} /> {movies.length === 0 ? 'Get AI Movie Picks' : 'Refresh Movie Picks'}</>
          )}
        </button>
      </div>
    </div>
  );
}