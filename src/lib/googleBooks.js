import { base44 } from '@/api/base44Client';

const cache = new Map();

export async function searchBooks(query, maxResults = 12) {
  const cacheKey = `search:${query}:${maxResults}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await base44.functions.invoke('googleBooks', { action: 'search', query, maxResults });
  const books = (res.data?.items || []).map(normalizeBook).filter(Boolean);
  cache.set(cacheKey, books);
  return books;
}

export async function getBookById(id) {
  const cacheKey = `book:${id}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await base44.functions.invoke('googleBooks', { action: 'get', bookId: id });
  const book = normalizeBook(res.data?.item);
  cache.set(cacheKey, book);
  return book;
}

export async function getBooksByCategory(category, maxResults = 8) {
  return searchBooks(`subject:${category}`, maxResults);
}

export const FALLBACK_TRENDING = [
  { google_books_id: 'fallback-1', title: 'The House in the Cerulean Sea', author: 'TJ Klune', description: 'A magical cozy fantasy about found family and unlikely love.', cover_image: 'https://books.google.com/books/content?id=8dVEEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fantasy'], published_date: '2020-03-17', page_count: 394, isbn: '', average_rating: 4.5, ratings_count: 120000, amazon_search_url: 'https://www.amazon.com/s?k=The+House+in+the+Cerulean+Sea' },
  { google_books_id: 'fallback-2', title: 'Piranesi', author: 'Susanna Clarke', description: 'A mysterious man lives in a labyrinthine house filled with endless halls and statues.', cover_image: 'https://books.google.com/books/content?id=sSCoDwAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fantasy', 'Mystery'], published_date: '2020-09-15', page_count: 272, isbn: '', average_rating: 4.2, ratings_count: 95000, amazon_search_url: 'https://www.amazon.com/s?k=Piranesi+Susanna+Clarke' },
  { google_books_id: 'fallback-3', title: 'Project Hail Mary', author: 'Andy Weir', description: 'A lone astronaut must save the Earth from a mysterious threat in this gripping sci-fi thriller.', cover_image: 'https://books.google.com/books/content?id=RsKfEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Science Fiction'], published_date: '2021-05-04', page_count: 476, isbn: '', average_rating: 4.6, ratings_count: 200000, amazon_search_url: 'https://www.amazon.com/s?k=Project+Hail+Mary+Andy+Weir' },
  { google_books_id: 'fallback-4', title: 'The Midnight Library', author: 'Matt Haig', description: 'Between life and death there is a library, and its books give you a chance to try another life.', cover_image: 'https://books.google.com/books/content?id=Ux3SDwAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fiction', 'Fantasy'], published_date: '2020-08-13', page_count: 288, isbn: '', average_rating: 4.1, ratings_count: 180000, amazon_search_url: 'https://www.amazon.com/s?k=The+Midnight+Library+Matt+Haig' },
  { google_books_id: 'fallback-5', title: 'Babel', author: 'R.F. Kuang', description: 'A dark academic fantasy about translation, colonialism, and the power of language at Oxford in the 1830s.', cover_image: 'https://books.google.com/books/content?id=kBZQEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fantasy', 'Historical Fiction'], published_date: '2022-08-23', page_count: 545, isbn: '', average_rating: 4.4, ratings_count: 120000, amazon_search_url: 'https://www.amazon.com/s?k=Babel+RF+Kuang' },
  { google_books_id: 'fallback-6', title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', description: 'A glamorous socialite investigates a mysterious estate in 1950s Mexico in this gothic horror.', cover_image: 'https://books.google.com/books/content?id=2paxDwAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Horror', 'Mystery'], published_date: '2020-06-30', page_count: 320, isbn: '', average_rating: 4.0, ratings_count: 110000, amazon_search_url: 'https://www.amazon.com/s?k=Mexican+Gothic+Moreno-Garcia' },
  { google_books_id: 'fallback-7', title: 'Anxious People', author: 'Fredrik Backman', description: 'A bank robbery leads to an apartment viewing, and a hostage situation that changes eight strangers.', cover_image: 'https://books.google.com/books/content?id=fOHRDwAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fiction'], published_date: '2020-09-08', page_count: 352, isbn: '', average_rating: 4.2, ratings_count: 85000, amazon_search_url: 'https://www.amazon.com/s?k=Anxious+People+Backman' },
  { google_books_id: 'fallback-8', title: 'Klara and the Sun', author: 'Kazuo Ishiguro', description: 'An Artificial Friend observes the world and learns what it means to love.', cover_image: 'https://books.google.com/books/content?id=K_P7DwAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Science Fiction', 'Literary Fiction'], published_date: '2021-03-02', page_count: 303, isbn: '', average_rating: 3.9, ratings_count: 75000, amazon_search_url: 'https://www.amazon.com/s?k=Klara+and+the+Sun+Ishiguro' },
  { google_books_id: 'fallback-9', title: 'Yellowface', author: 'R.F. Kuang', description: 'A dark satire about race, cultural appropriation, and the publishing industry.', cover_image: 'https://books.google.com/books/content?id=k5qoEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fiction', 'Thriller'], published_date: '2023-05-16', page_count: 336, isbn: '', average_rating: 4.1, ratings_count: 95000, amazon_search_url: 'https://www.amazon.com/s?k=Yellowface+RF+Kuang' },
  { google_books_id: 'fallback-10', title: 'Lessons in Chemistry', author: 'Bonnie Garmus', description: 'A chemist becomes a cooking show host in 1960s America, teaching women much more than recipes.', cover_image: 'https://books.google.com/books/content?id=IQNGEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fiction', 'Historical Fiction'], published_date: '2022-04-05', page_count: 390, isbn: '', average_rating: 4.4, ratings_count: 250000, amazon_search_url: 'https://www.amazon.com/s?k=Lessons+in+Chemistry+Garmus' },
];

export const EDITORS_PICKS = [
  { google_books_id: 'ep-1', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', description: 'Two friends bond over video games in a novel about creativity, failure, and the nature of love.', cover_image: 'https://books.google.com/books/content?id=RNpNEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fiction'], published_date: '2022-07-05', page_count: 401, isbn: '', average_rating: 4.3, ratings_count: 180000, amazon_search_url: 'https://www.amazon.com/s?k=Tomorrow+Gabrielle+Zevin' },
  { google_books_id: 'ep-2', title: 'Fourth Wing', author: 'Rebecca Yarros', description: 'A young woman enters a war college for dragon riders in this gripping romantic fantasy.', cover_image: 'https://books.google.com/books/content?id=_MChEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fantasy', 'Romance'], published_date: '2023-05-02', page_count: 512, isbn: '', average_rating: 4.5, ratings_count: 350000, amazon_search_url: 'https://www.amazon.com/s?k=Fourth+Wing+Yarros' },
  { google_books_id: 'ep-3', title: 'Demon Copperhead', author: 'Barbara Kingsolver', description: 'A Pulitzer Prize–winning modern retelling of David Copperfield set in Appalachia.', cover_image: 'https://books.google.com/books/content?id=FTBGEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Literary Fiction'], published_date: '2022-10-18', page_count: 560, isbn: '', average_rating: 4.3, ratings_count: 90000, amazon_search_url: 'https://www.amazon.com/s?k=Demon+Copperhead+Kingsolver' },
  { google_books_id: 'ep-4', title: 'The Covenant of Water', author: 'Abraham Verghese', description: 'A sweeping multigenerational saga spanning 77 years and three generations of a family in South India.', cover_image: 'https://books.google.com/books/content?id=5b6KEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Historical Fiction'], published_date: '2023-05-02', page_count: 724, isbn: '', average_rating: 4.6, ratings_count: 60000, amazon_search_url: 'https://www.amazon.com/s?k=Covenant+of+Water+Verghese' },
  { google_books_id: 'ep-5', title: 'Holly', author: 'Stephen King', description: 'Holly Gibney faces her most dangerous case yet in this chilling thriller from the master of horror.', cover_image: 'https://books.google.com/books/content?id=XqenEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Thriller', 'Horror'], published_date: '2023-09-05', page_count: 464, isbn: '', average_rating: 4.1, ratings_count: 70000, amazon_search_url: 'https://www.amazon.com/s?k=Holly+Stephen+King' },
  { google_books_id: 'ep-6', title: 'Iron Flame', author: 'Rebecca Yarros', description: "The electrifying sequel to Fourth Wing, continuing Violet Sorrengail's story at Basgiath War College.", cover_image: 'https://books.google.com/books/content?id=oa7MEAAAQBAJ&printsec=frontcover&img=1&zoom=1', categories: ['Fantasy', 'Romance'], published_date: '2023-11-07', page_count: 640, isbn: '', average_rating: 4.4, ratings_count: 200000, amazon_search_url: 'https://www.amazon.com/s?k=Iron+Flame+Yarros' },
];

export function normalizeBook(item) {
  if (!item) return null;
  const info = item.volumeInfo || {};
  const id = item.id || '';
  const title = info.title || 'Unknown Title';
  const author = (info.authors || ['Unknown Author']).join(', ');
  const cover = getCoverImage(info, id);
  
  // Derive recommended age from maturityRating
  const maturity = info.maturityRating || 'NOT_MATURE';
  const ageRating = maturity === 'MATURE' ? '18+' : maturity === 'NOT_MATURE' ? 'All Ages' : null;
  // Lexile is not directly in Google Books API but we can use page count + categories as proxy label
  // Google Books sometimes includes it in description or series info — surface what we have
  const lexileNote = info.seriesInfo?.bookDisplayNumber ? `Series Book ${info.seriesInfo.bookDisplayNumber}` : null;

  return {
    google_books_id: id,
    title,
    author,
    description: info.description || '',
    cover_image: cover,
    categories: info.categories || [],
    published_date: info.publishedDate || '',
    page_count: info.pageCount || 0,
    isbn: (info.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || '',
    average_rating: info.averageRating || 0,
    ratings_count: info.ratingsCount || 0,
    age_rating: ageRating,
    maturity_rating: maturity,
    lexile_note: lexileNote,
    amazon_search_url: `https://www.amazon.com/s?k=${encodeURIComponent(title + ' ' + author)}`,
  };
}

function getCoverImage(info, id) {
  const images = info.imageLinks || {};
  if (images.thumbnail) return images.thumbnail.replace('http://', 'https://');
  if (images.smallThumbnail) return images.smallThumbnail.replace('http://', 'https://');
  if (id) return `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1`;
  return null;
}