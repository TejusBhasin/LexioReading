import { base44 } from '@/api/base44Client';

const IMG_BASE = 'https://image.tmdb.org/t/p';

export function posterUrl(path, size = 'w342') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export async function searchMovies(query, limit = 12) {
  if (!query?.trim()) return [];
  const res = await base44.functions.invoke('tmdbRequest', { action: 'search', query, page: 1 });
  const body = res.data || {};
  const results = (body.results || []).slice(0, limit).map(normalizeMovieLight).filter(Boolean);
  return results;
}

export async function getTrendingMovies() {
  const res = await base44.functions.invoke('tmdbRequest', { action: 'trending', page: 1 });
  const body = res.data || {};
  return (body.results || []).slice(0, 18).map(normalizeMovieLight).filter(Boolean);
}

export async function getTopRatedMovies() {
  const res = await base44.functions.invoke('tmdbRequest', { action: 'top_rated', page: 1 });
  const body = res.data || {};
  return (body.results || []).slice(0, 18).map(normalizeMovieLight).filter(Boolean);
}

export async function getPopularMovies() {
  const res = await base44.functions.invoke('tmdbRequest', { action: 'popular', page: 1 });
  const body = res.data || {};
  return (body.results || []).slice(0, 18).map(normalizeMovieLight).filter(Boolean);
}

// AI-driven: asks the LLM for movie titles matching the user's taste, then resolves them via TMDB.
export async function getMovieRecommendations(prefs) {
  const genres = (prefs?.favorite_genres || []).join(', ');
  const moods = (prefs?.moods || []).join(', ');
  const prompt = `Suggest 8 real, well-known movie titles a viewer would enjoy based on these preferences. Favorite genres: ${genres || 'not set'}. Preferred moods: ${moods || 'not set'}. Return ONLY a JSON object with a "titles" array of title strings, no explanation.`;
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object', properties: { titles: { type: 'array', items: { type: 'string' } } }, required: ['titles'] },
      model: 'gpt_5_mini',
    });
    const titles = (res?.titles || []).slice(0, 8);
    const results = await Promise.all(titles.map((t) => searchMovies(t, 3).catch(() => [])));
    const pool = results.flat();
    const unique = Object.values(Object.fromEntries(pool.map((m) => [m.tmdb_id, m])));
    return unique.slice(0, 12);
  } catch (e) {
    return [];
  }
}

export async function getMovieDetails(movieId) {
  const res = await base44.functions.invoke('tmdbRequest', { action: 'details', movie_id: movieId });
  return normalizeMovieFull(res.data);
}

function normalizeMovieLight(m) {
  if (!m || !m.id) return null;
  return {
    tmdb_id: String(m.id),
    id: String(m.id),
    title: m.title || m.name || 'Untitled',
    description: m.overview || '',
    cover_image: posterUrl(m.poster_path),
    backdrop_image: posterUrl(m.backdrop_path, 'w780'),
    release_year: m.release_date ? m.release_date.slice(0, 4) : '',
    published_date: m.release_date || '',
    average_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
    ratings_count: m.vote_count || 0,
    media_type: 'movie',
  };
}

function normalizeMovieFull(m) {
  if (!m) return null;
  const director = (m.credits?.crew || []).find((c) => c.job === 'Director')?.name || '';
  const cast = (m.credits?.cast || []).slice(0, 10).map((c) => ({ name: c.name, character: c.character }));
  const genres = (m.genres || []).map((g) => g.name);
  const reviews = (m.reviews?.results || []).slice(0, 6).map((r) => ({
    author: r.author || r.author_details?.name || 'Anonymous',
    rating: r.author_details?.rating ? r.author_details.rating / 2 : null,
    content: r.content || '',
  }));
  const trailer = (m.videos?.results || []).find((v) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
  return {
    ...normalizeMovieLight(m),
    director,
    cast,
    genres,
    categories: genres,
    runtime: m.runtime || 0,
    tagline: m.tagline || '',
    reviews,
    trailer,
  };
}