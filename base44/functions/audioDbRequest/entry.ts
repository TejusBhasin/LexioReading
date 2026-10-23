import { secrets } from "base44:runtime";

// Public TheAudioDB proxy. Reads stay server-side so the API key
// is never exposed to the client. The free API supports: album search
// (by artist name), artist search, and track details.
export default async function (req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    const { action, query, track_id } = body || {};
    const apiKey = secrets.get("AUDIO_DB_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'AudioDB key not configured' }, { status: 500 });
    }

    const base = `https://www.theaudiodb.com/api/v1/json/${apiKey}`;
    const headers = { accept: 'application/json' };

    if (action === 'search') {
      if (!query) return Response.json({ error: 'query is required' }, { status: 400 });
      const [albumRes, artistRes] = await Promise.allSettled([
        fetch(`${base}/searchalbum.php?s=${encodeURIComponent(query)}`, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(`${base}/search.php?s=${encodeURIComponent(query)}`, { headers, signal: AbortSignal.timeout(10000) }),
      ]);
      const albums = albumRes.status === 'fulfilled' && albumRes.value.ok ? (await albumRes.value.json()).album || [] : [];
      const artists = artistRes.status === 'fulfilled' && artistRes.value.ok ? (await artistRes.value.json()).artists || [] : [];
      return Response.json({ albums, artists });
    }

    if (action === 'details') {
      if (!track_id) return Response.json({ error: 'track_id is required' }, { status: 400 });
      const res = await fetch(`${base}/track.php?m=${encodeURIComponent(track_id)}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return Response.json({ error: `AudioDB error ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json({ tracks: data.track || [] });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}