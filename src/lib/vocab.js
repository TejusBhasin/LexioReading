// Vocabulary swap so each mode reads naturally: movies-only users never see
// "reading", music-only users see "listening", and mixed modes get combined phrasing.
export function getVocab(contentMode) {
  const mode = contentMode || 'books';
  if (mode === 'movies') {
    return {
      reading: 'watching', read: 'watch', finished: 'watched',
      wantToRead: 'Want to Watch', readingNow: 'Watching Now',
      currentlyReading: 'Currently Watching', recentlyFinished: 'Recently Watched',
      totalBooks: 'Total Movies', library: 'Watchlist',
      books: 'movies', Books: 'Movies', book: 'movie', Book: 'Movie',
      nounPlural: 'movies', noun: 'movie', author: 'director', Author: 'Director',
      companion: 'movie companion',
      searchPlaceholder: 'Search movies by title or keyword...',
      cantFind: "Can't find the movie you're looking for?",
      noResults: 'No movies found',
    };
  }
  if (mode === 'books_movies') {
    return {
      reading: 'reading & watching', read: 'read/watch', finished: 'finished',
      wantToRead: 'Want to Read/Watch', readingNow: 'Reading & Watching',
      currentlyReading: 'Currently Reading & Watching', recentlyFinished: 'Recently Finished',
      totalBooks: 'Total Books & Movies', library: 'Library & Watchlist',
      books: 'books & movies', Books: 'Books & Movies', book: 'book or movie', Book: 'Book/Movie',
      nounPlural: 'books and movies', noun: 'title', author: 'author/director', Author: 'Author/Director',
      companion: 'reading and movies companion',
      searchPlaceholder: 'Search books or movies by title, author, or keyword...',
      cantFind: "Can't find the book or movie you're looking for?",
      noResults: 'No results',
    };
  }
  if (mode === 'music') {
    return {
      reading: 'listening', read: 'listen', finished: 'listened',
      wantToRead: 'Want to Listen', readingNow: 'Listening Now',
      currentlyReading: 'Currently Listening', recentlyFinished: 'Recently Listened',
      totalBooks: 'Total Music', library: 'Music Library',
      books: 'tracks', Books: 'Music', book: 'track', Book: 'Track',
      nounPlural: 'music', noun: 'track', author: 'artist', Author: 'Artist',
      companion: 'music companion',
      searchPlaceholder: 'Search music by artist (e.g. Adele)...',
      cantFind: "Can't find the song you're looking for?",
      noResults: 'No music found',
    };
  }
  if (mode === 'books_music') {
    return {
      reading: 'reading & listening', read: 'read/listen', finished: 'finished',
      wantToRead: 'Want to Read/Listen', readingNow: 'Reading & Listening',
      currentlyReading: 'Currently Reading & Listening', recentlyFinished: 'Recently Finished',
      totalBooks: 'Total Books & Music', library: 'Library & Music',
      books: 'books & music', Books: 'Books & Music', book: 'book or track', Book: 'Book/Track',
      nounPlural: 'books and music', noun: 'title', author: 'author/artist', Author: 'Author/Artist',
      companion: 'reading and music companion',
      searchPlaceholder: 'Search books, or music by artist...',
      cantFind: "Can't find the book or song you're looking for?",
      noResults: 'No results',
    };
  }
  if (mode === 'movies_music') {
    return {
      reading: 'watching & listening', read: 'watch/listen', finished: 'finished',
      wantToRead: 'Want to Watch/Listen', readingNow: 'Watching & Listening',
      currentlyReading: 'Currently Watching & Listening', recentlyFinished: 'Recently Finished',
      totalBooks: 'Total Movies & Music', library: 'Watchlist & Music',
      books: 'movies & music', Books: 'Movies & Music', book: 'movie or track', Book: 'Movie/Track',
      nounPlural: 'movies and music', noun: 'title', author: 'artist', Author: 'Artist',
      companion: 'movies and music companion',
      searchPlaceholder: 'Search movies or music...',
      cantFind: "Can't find the movie or song you're looking for?",
      noResults: 'No results',
    };
  }
  if (mode === 'all') {
    return {
      reading: 'reading, watching & listening', read: 'read/watch/listen', finished: 'finished',
      wantToRead: 'Want to Experience', readingNow: 'In Progress',
      currentlyReading: 'Currently Into', recentlyFinished: 'Recently Finished',
      totalBooks: 'Total Library', library: 'Library',
      books: 'books, movies & music', Books: 'Books, Movies & Music', book: 'book, movie or track', Book: 'Item',
      nounPlural: 'books, movies and music', noun: 'title', author: 'author/director/artist', Author: 'Creator',
      companion: 'reading, movies and music companion',
      searchPlaceholder: 'Search books, movies, or music...',
      cantFind: "Can't find what you're looking for?",
      noResults: 'No results',
    };
  }
  return {
    reading: 'reading', read: 'read', finished: 'finished',
    wantToRead: 'Want to Read', readingNow: 'Reading Now',
    currentlyReading: 'Currently Reading', recentlyFinished: 'Recently Finished',
    totalBooks: 'Total Books', library: 'Library',
    books: 'books', Books: 'Books', book: 'book', Book: 'Book',
    nounPlural: 'books', noun: 'book', author: 'author', Author: 'Author',
    companion: 'reading companion',
    searchPlaceholder: 'Search by title, author, or keyword...',
    cantFind: "Can't find the book you're looking for?",
    noResults: 'No results',
  };
}