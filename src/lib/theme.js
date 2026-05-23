// Theme system for Lexio
// Bold mode: high contrast, strong shadows, vibrant accents
// Minimal mode: refined, clean, airy

export const BOLD_DARK = {
  '--bg-primary': '#0a0a0a',
  '--bg-secondary': '#111111',
  '--bg-card': '#161616',
  '--bg-elevated': '#1e1e1e',
  '--text-primary': '#f5f0e8',
  '--text-secondary': '#a09880',
  '--text-muted': '#5c5549',
  '--accent': '#e8c547',
  '--accent-hover': '#f0d060',
  '--accent-secondary': '#c4433a',
  '--border': '#2a2520',
  '--border-strong': '#3d3830',
  '--shadow': '0 4px 24px rgba(0,0,0,0.6)',
  '--shadow-card': '0 8px 32px rgba(0,0,0,0.5)',
  '--radius': '4px',
};

export const BOLD_LIGHT = {
  '--bg-primary': '#faf8f3',
  '--bg-secondary': '#f0ede4',
  '--bg-card': '#ffffff',
  '--bg-elevated': '#f7f4ef',
  '--text-primary': '#0a0a0a',
  '--text-secondary': '#4a4035',
  '--text-muted': '#8a7d6e',
  '--accent': '#d4a017',
  '--accent-hover': '#e8b520',
  '--accent-secondary': '#c4433a',
  '--border': '#e0d8cc',
  '--border-strong': '#c8bfb0',
  '--shadow': '0 4px 24px rgba(0,0,0,0.12)',
  '--shadow-card': '4px 4px 0px #0a0a0a',
  '--radius': '4px',
};

export const MINIMAL_DARK = {
  '--bg-primary': '#0d0d0d',
  '--bg-secondary': '#141414',
  '--bg-card': '#1a1a1a',
  '--bg-elevated': '#212121',
  '--text-primary': '#f0f0f0',
  '--text-secondary': '#888888',
  '--text-muted': '#444444',
  '--accent': '#6366f1',
  '--accent-hover': '#7c7ff3',
  '--accent-secondary': '#06b6d4',
  '--border': '#262626',
  '--border-strong': '#333333',
  '--shadow': '0 2px 12px rgba(0,0,0,0.4)',
  '--shadow-card': '0 4px 20px rgba(0,0,0,0.3)',
  '--radius': '12px',
};

export const MINIMAL_LIGHT = {
  '--bg-primary': '#ffffff',
  '--bg-secondary': '#f8f8f8',
  '--bg-card': '#ffffff',
  '--bg-elevated': '#f4f4f4',
  '--text-primary': '#0d0d0d',
  '--text-secondary': '#555555',
  '--text-muted': '#aaaaaa',
  '--accent': '#6366f1',
  '--accent-hover': '#4f52e8',
  '--accent-secondary': '#06b6d4',
  '--border': '#ebebeb',
  '--border-strong': '#d4d4d4',
  '--shadow': '0 2px 8px rgba(0,0,0,0.06)',
  '--shadow-card': '0 4px 16px rgba(0,0,0,0.08)',
  '--radius': '12px',
};

export function getBaseTheme(mode, colorScheme) {
  if (mode === 'bold' && colorScheme === 'dark') return BOLD_DARK;
  if (mode === 'bold' && colorScheme === 'light') return BOLD_LIGHT;
  if (mode === 'minimal' && colorScheme === 'dark') return MINIMAL_DARK;
  if (mode === 'minimal' && colorScheme === 'light') return MINIMAL_LIGHT;
  return BOLD_DARK;
}

export function applyTheme(prefs) {
  const mode = prefs?.theme_mode || 'bold';
  const colorScheme = prefs?.color_scheme || 'dark';
  const base = getBaseTheme(mode, colorScheme);

  const final = { ...base };
  if (prefs?.custom_primary) final['--accent'] = prefs.custom_primary;
  if (prefs?.custom_accent) final['--accent-secondary'] = prefs.custom_accent;
  if (prefs?.custom_secondary) final['--bg-elevated'] = prefs.custom_secondary;

  const root = document.documentElement;
  Object.entries(final).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Add class for radius style
  root.classList.remove('theme-bold', 'theme-minimal');
  root.classList.add(`theme-${mode}`);
  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(`theme-${colorScheme}`);
}

export const GENRE_OPTIONS = [
  'Science Fiction', 'Fantasy', 'Mystery', 'Thriller', 'Romance',
  'Historical Fiction', 'Literary Fiction', 'Horror', 'Biography',
  'Self-Help', 'Business', 'Philosophy', 'Psychology', 'Science',
  'True Crime', 'Graphic Novel', 'Poetry', 'Short Stories', 'Adventure', 'Humor'
];

export const MOOD_OPTIONS = [
  'Dark & Intense', 'Light & Fun', 'Thought-provoking', 'Emotional',
  'Action-packed', 'Cozy', 'Mind-bending', 'Inspiring', 'Escapist', 'Nostalgic'
];

export const SAMPLE_BOOKS = [
  {
    id: 'demo-1',
    google_books_id: 'demo-1',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    cover_image: 'https://books.google.com/books/content?id=rkFuEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Science Fiction'],
    ai_hook: 'A lone astronaut wakes up with no memory — and the fate of Earth in his hands.',
    amazon_search_url: 'https://www.amazon.com/s?k=Project+Hail+Mary+Andy+Weir'
  },
  {
    id: 'demo-2',
    google_books_id: 'demo-2',
    title: 'The House in the Cerulean Sea',
    author: 'TJ Klune',
    cover_image: 'https://books.google.com/books/content?id=8VAGEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Fantasy'],
    ai_hook: 'A heartwarming found-family fantasy where a caseworker falls for the master of dangerous magical children.',
    amazon_search_url: 'https://www.amazon.com/s?k=House+Cerulean+Sea+TJ+Klune'
  },
  {
    id: 'demo-3',
    google_books_id: 'demo-3',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    cover_image: 'https://books.google.com/books/content?id=3NQHEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Literary Fiction', 'Fantasy'],
    ai_hook: 'A man lives alone in a labyrinthine house — except he\'s not truly alone.',
    amazon_search_url: 'https://www.amazon.com/s?k=Piranesi+Susanna+Clarke'
  },
  {
    id: 'demo-4',
    google_books_id: 'demo-4',
    title: 'Fourth Wing',
    author: 'Rebecca Yarros',
    cover_image: 'https://books.google.com/books/content?id=G1CiEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Fantasy', 'Romance'],
    ai_hook: 'Dragon riders, forbidden romance, and a war academy where the stakes are survival.',
    amazon_search_url: 'https://www.amazon.com/s?k=Fourth+Wing+Rebecca+Yarros'
  },
  {
    id: 'demo-5',
    google_books_id: 'demo-5',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    cover_image: 'https://books.google.com/books/content?id=0GBREAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Literary Fiction'],
    ai_hook: 'Two friends build a video game empire across decades — and navigate love without ever quite naming it.',
    amazon_search_url: 'https://www.amazon.com/s?k=Tomorrow+and+Tomorrow+Gabrielle+Zevin'
  },
  {
    id: 'demo-6',
    google_books_id: 'demo-6',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover_image: 'https://books.google.com/books/content?id=WN3EDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
    categories: ['Literary Fiction', 'Fantasy'],
    ai_hook: 'Between life and death sits a library of infinite regrets — and second chances.',
    amazon_search_url: 'https://www.amazon.com/s?k=The+Midnight+Library+Matt+Haig'
  }
];