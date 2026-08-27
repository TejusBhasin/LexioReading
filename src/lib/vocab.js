// Vocabulary swap so movies-only users never see the word "reading".
export function getVocab(contentMode) {
  if (contentMode === 'movies') {
    return {
      reading: 'watching',
      read: 'watch',
      finished: 'watched',
      wantToRead: 'Want to Watch',
      readingNow: 'Watching Now',
      currentlyReading: 'Currently Watching',
      recentlyFinished: 'Recently Watched',
      totalBooks: 'Total Movies',
      library: 'Watchlist',
      books: 'movies',
      Books: 'Movies',
      book: 'movie',
      Book: 'Movie',
      nounPlural: 'movies',
      noun: 'movie',
      author: 'director',
      Author: 'Director',
    };
  }
  return {
    reading: 'reading',
    read: 'read',
    finished: 'finished',
    wantToRead: 'Want to Read',
    readingNow: 'Reading Now',
    currentlyReading: 'Currently Reading',
    recentlyFinished: 'Recently Finished',
    totalBooks: 'Total Books',
    library: 'Library',
    books: 'books',
    Books: 'Books',
    book: 'book',
    Book: 'Book',
    nounPlural: 'books',
    noun: 'book',
    author: 'author',
    Author: 'Author',
  };
}