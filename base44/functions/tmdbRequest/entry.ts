import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Public TMDB proxy. Reads stay server-side so the read-access token
// is never exposed to the client. Supports: search, trending, details,
// popular, top_rated.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    const { action, query, movie_id, page = 1 } = body || {};
    const token = process.env.TMDB_READ_TOKEN;
    if (!token) {
      return Response.json({ error: 'TMDB token not configured' }, { status: 500 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    };

    let url;
    switch (action) {
      case 'search':
        if (!query) return Response.json({ error: 'query is required' }, { status: 400 });
        url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
        break;
      case 'trending':
        url = `${TMDB_BASE}/trending/movie/week?page=${page}`;
        break;
      case 'popular':
        url = `${TMDB_BASE}/movie/popular?page=${page}`;
        break;
      case 'top_rated':
        url = `${TMDB_BASE}/movie/top_rated?page=${page}`;
        break;
      case 'details':
        if (!movie_id) return Response.json({ error: 'movie_id is required' }, { status: 400 });
        url = `${TMDB_BASE}/movie/${movie_id}?append_to_response=credits,reviews,videos,release_dates,images`;
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return Response.json({ error: `TMDB error ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return Response.json({ ...data, img_base: IMG_BASE });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}