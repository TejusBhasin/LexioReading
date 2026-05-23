const API_KEY = 'AIzaSyACl8p03XftFAWM81Th3wcVeWHJY4QyXkw';
const BASE_URL = 'https://www.googleapis.com/books/v1';

const cache = new Map();

export async function searchBooks(query, maxResults = 12) {
  const cacheKey = `search:${query}:${maxResults}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `${BASE_URL}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const books = (data.items || []).map(normalizeBook);
  cache.set(cacheKey, books);
  return books;
}

export async function getBookById(id) {
  const cacheKey = `book:${id}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `${BASE_URL}/volumes/${id}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const book = normalizeBook(data);
  cache.set(cacheKey, book);
  return book;
}

export async function getBooksByCategory(category, maxResults = 8) {
  return searchBooks(`subject:${category}`, maxResults);
}

export function normalizeBook(item) {
  if (!item) return null;
  const info = item.volumeInfo || {};
  const id = item.id || '';
  const title = info.title || 'Unknown Title';
  const author = (info.authors || ['Unknown Author']).join(', ');
  const cover = getCoverImage(info, id);
  
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