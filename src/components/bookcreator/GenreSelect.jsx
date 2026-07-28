import React from 'react';
import { Feather, ArrowRight } from 'lucide-react';

const GENRES = [
  { id: 'Fiction', emoji: '📖' },
  { id: 'Realistic Fiction', emoji: '🏡' },
  { id: 'Non-Fiction', emoji: '📋' },
  { id: 'Fantasy', emoji: '🐉' },
  { id: 'Science Fiction', emoji: '🚀' },
  { id: 'Mystery', emoji: '🔍' },
  { id: 'Thriller', emoji: '🔪' },
  { id: 'Romance', emoji: '❤️' },
  { id: 'Historical Fiction', emoji: '🏛️' },
  { id: 'Horror', emoji: '👻' },
  { id: 'Adventure', emoji: '🗺️' },
  { id: 'Biography', emoji: '👤' },
  { id: 'Self-Help', emoji: '💡' },
  { id: 'Poetry', emoji: '🎭' },
  { id: 'Dystopian', emoji: '🌆' },
  { id: 'Young Adult', emoji: '🎓' },
  { id: "Children's", emoji: '🧸' },
  { id: 'Literary Fiction', emoji: '✒️' },
  { id: 'Humor', emoji: '😂' },
  { id: 'Drama', emoji: '🎬' },
];

export default function GenreSelect({ onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
        <Feather size={18} style={{ color: 'var(--lx-accent)' }} />
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Custom Book Creator</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
        <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          What type of book is this?
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Pick a genre to get started. You'll refine the details in the chat next.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {GENRES.map(({ id, emoji }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--lx-border)',
              }}
            >
              <span className="text-lg flex-shrink-0">{emoji}</span>
              <span className="flex-1 text-left">{id}</span>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
        <button
          onClick={() => onSelect(null)}
          className="w-full text-sm py-3 rounded-xl transition-all hover:opacity-80"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--lx-border)' }}
        >
          Skip — I'll decide in chat
        </button>
      </div>
    </div>
  );
}