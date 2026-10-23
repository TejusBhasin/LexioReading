// Content-mode helpers. A content_mode is a combination of the three
// trackable media types: books, movies, and music.

export function modeHasBooks(mode) {
  return ['books', 'books_movies', 'books_music', 'all'].includes(mode);
}

export function modeHasMovies(mode) {
  return ['movies', 'books_movies', 'movies_music', 'all'].includes(mode);
}

export function modeHasMusic(mode) {
  return ['music', 'books_music', 'movies_music', 'all'].includes(mode);
}

export function modeToCombo(mode) {
  return {
    books: modeHasBooks(mode),
    movies: modeHasMovies(mode),
    music: modeHasMusic(mode),
  };
}

export function comboToMode({ books, movies, music }) {
  const b = !!books, m = !!movies, mu = !!music;
  if (b && m && mu) return 'all';
  if (b && m) return 'books_movies';
  if (b && mu) return 'books_music';
  if (m && mu) return 'movies_music';
  if (b) return 'books';
  if (m) return 'movies';
  if (mu) return 'music';
  return 'books';
}

// Adds music to an existing mode, keeping books/movies as they are.
export function addMusicToMode(mode) {
  const combo = modeToCombo(mode);
  combo.music = true;
  return comboToMode(combo);
}