// Vocabulary swap so movies-only users never see "reading",
// and books+movies users see "reading and movies" phrasing.
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