import { base44 } from '@/api/base44Client';

// TheAudioDB data layer — music search (albums by artist, artists) and details.

async function call(action, params) {
  const res = await base44.functions.invoke('audioDbRequest', { action, ...params });
  return res.data;
}

function normalizeAlbum(a) {
  if (!a) return null;
  return {
    kind: 'album',
    audiodb_id: String(a.idAlbum || ''),
    title: a.strAlbum || 'Untitled album',
    artist: a.strArtist || '',
    album: a.strAlbum || '',
    cover_image: a.strAlbumThumb || a.strAlbumThumbHQ || '',
    genre: a.strGenre || '',
    year: a.intYearReleased || '',
  };
}

function normalizeArtist(a) {
  if (!a) return null;
  return {
    kind: 'artist',
    audiodb_id: String(a.idArtist || ''),
    title: a.strArtist || 'Unknown artist',
    artist: a.strArtist || '',
    album: '',
    cover_image: a.strArtistThumb || a.strArtistFanart || '',
    genre: a.strGenre || '',
    year: a.intBornYear || a.intFormedYear || '',
  };
}

// Search music by artist name: returns that artist's albums,
// falling back to matching artists when no albums are found.
export async function searchMusic(query, limit = 12) {
  const data = await call('search', { query });
  const albums = (data.albums || []).map(normalizeAlbum).filter(a => a && a.audiodb_id && a.title);
  if (albums.length) return albums.slice(0, limit);
  const artists = (data.artists || []).map(normalizeArtist).filter(a => a && a.audiodb_id);
  return artists.slice(0, limit);
}