// Theme system for Lexio
// Bold mode: high contrast, strong shadows, vibrant accents
// Minimal mode: refined, clean, airy
// Each theme includes shadcn HSL compat variables so shadcn/ui components adapt.

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
  '--border': '30 14% 15%',
  '--border-strong': '#3d3830',
  '--shadow': '0 4px 24px rgba(0,0,0,0.6)',
  '--shadow-card': '0 8px 32px rgba(0,0,0,0.5)',
  '--radius': '4px',
  // Shadcn compat (HSL)
  '--background': '0 0% 4%',
  '--foreground': '30 10% 95%',
  '--card': '0 0% 8%',
  '--card-foreground': '30 10% 95%',
  '--popover': '0 0% 8%',
  '--popover-foreground': '30 10% 95%',
  '--primary': '52 91% 55%',
  '--primary-foreground': '0 0% 0%',
  '--secondary': '0 0% 10%',
  '--secondary-foreground': '30 10% 95%',
  '--muted': '0 0% 10%',
  '--muted-foreground': '30 4% 46%',
  '--accent-foreground': '30 10% 95%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--input': '0 0% 16%',
  '--ring': '52 91% 55%',
};

export const BOLD_LIGHT = {
  '--bg-primary': '#faf7f0',
  '--bg-secondary': '#f2ede2',
  '--bg-card': '#ffffff',
  '--bg-elevated': '#f5f0e6',
  '--text-primary': '#1a1410',
  '--text-secondary': '#5c4f3f',
  '--text-muted': '#9a8d7a',
  '--accent': '#c8941a',
  '--accent-hover': '#d4a82a',
  '--accent-secondary': '#b8433a',
  '--border': '36 27% 84%',
  '--border-strong': '#d0c7b8',
  '--shadow': '0 4px 24px rgba(26,20,16,0.10)',
  '--shadow-card': '4px 4px 0px #1a1410',
  '--radius': '6px',
  // Shadcn compat (HSL)
  '--background': '40 35% 97%',
  '--foreground': '20 14% 8%',
  '--card': '0 0% 100%',
  '--card-foreground': '20 14% 8%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '20 14% 8%',
  '--primary': '43 79% 44%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '40 30% 92%',
  '--secondary-foreground': '20 14% 8%',
  '--muted': '40 30% 92%',
  '--muted-foreground': '30 10% 49%',
  '--accent-foreground': '20 14% 8%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--input': '36 27% 84%',
  '--ring': '43 79% 44%',
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
  '--border': '0 0% 15%',
  '--border-strong': '#333333',
  '--shadow': '0 2px 12px rgba(0,0,0,0.4)',
  '--shadow-card': '0 4px 20px rgba(0,0,0,0.3)',
  '--radius': '12px',
  // Shadcn compat (HSL)
  '--background': '0 0% 5%',
  '--foreground': '0 0% 94%',
  '--card': '0 0% 10%',
  '--card-foreground': '0 0% 94%',
  '--popover': '0 0% 10%',
  '--popover-foreground': '0 0% 94%',
  '--primary': '239 84% 67%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '0 0% 8%',
  '--secondary-foreground': '0 0% 94%',
  '--muted': '0 0% 8%',
  '--muted-foreground': '0 0% 27%',
  '--accent-foreground': '0 0% 94%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--input': '0 0% 15%',
  '--ring': '239 84% 67%',
};

export const MINIMAL_LIGHT = {
  '--bg-primary': '#ffffff',
  '--bg-secondary': '#f9f9fb',
  '--bg-card': '#ffffff',
  '--bg-elevated': '#f4f4f7',
  '--text-primary': '#0d0d0d',
  '--text-secondary': '#555555',
  '--text-muted': '#aaaaaa',
  '--accent': '#6366f1',
  '--accent-hover': '#4f52e8',
  '--accent-secondary': '#06b6d4',
  '--border': '0 0% 92%',
  '--border-strong': '#d4d4d4',
  '--shadow': '0 2px 8px rgba(0,0,0,0.06)',
  '--shadow-card': '0 4px 16px rgba(0,0,0,0.08)',
  '--radius': '12px',
  // Shadcn compat (HSL)
  '--background': '0 0% 100%',
  '--foreground': '0 0% 5%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 5%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 5%',
  '--primary': '239 84% 67%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '0 0% 97%',
  '--secondary-foreground': '0 0% 5%',
  '--muted': '0 0% 97%',
  '--muted-foreground': '0 0% 67%',
  '--accent-foreground': '0 0% 5%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--input': '0 0% 92%',
  '--ring': '239 84% 67%',
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
  const systemDark = !prefs?.color_scheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches !== false;
  const colorScheme = prefs?.color_scheme || (systemDark ? 'dark' : 'dark');
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

export const SIMPLE_MODE_TABS = ['/clubs', '/forums', '/reviews'];
export const SIMPLE_MODE_GENRES = ['Romance', 'Horror', 'Self-Help', 'True Crime'];
export const SIMPLE_MODE_MOODS = ['Dark & Intense', 'Emotional', 'Cozy', 'Escapist', 'Nostalgic'];

export const ALL_HIDEABLE_TABS = [
  { path: '/clubs', label: 'Clubs' },
  { path: '/forums', label: 'Forums' },
  { path: '/reviews', label: 'Reviews' },
  { path: '/chat', label: 'Chat' },
  { path: '/vault', label: 'Vault' },
  { path: '/wrapped', label: 'Wrapped' },
  { path: '/discover', label: 'Discover' },
  { path: '/book-creator', label: 'Book Creator' },
  { path: '/goal', label: 'Reading Goal' },
  { path: '/quotes', label: 'Quotes' },
  { path: '/challenges', label: 'Challenges' },
  { path: '/strength', label: 'Reading Strength' },
  { path: '/reading-log', label: 'Reading Log' },
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