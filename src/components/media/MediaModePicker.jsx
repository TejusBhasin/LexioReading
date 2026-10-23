import React from 'react';
import { BookOpen, Film, Music, Check } from 'lucide-react';
import { modeToCombo, comboToMode } from '@/lib/mediaModes';

const OPTIONS = [
  { key: 'books', icon: BookOpen, title: 'Books', desc: 'Discover, track, and review books.' },
  { key: 'movies', icon: Film, title: 'Movies', desc: 'Discover films, build a watchlist, and rate what you watch.' },
  { key: 'music', icon: Music, title: 'Music', desc: 'Search millions of songs and save your favorites.' },
];

// Any-combination picker for the three trackable media types (books/movies/music).
export default function MediaModePicker({ value, onChange }) {
  const combo = modeToCombo(value);

  function toggle(key) {
    const next = { ...combo, [key]: !combo[key] };
    // Don't allow unchecking the last remaining media type
    if (!next.books && !next.movies && !next.music) return;
    onChange(comboToMode(next));
  }

  return (
    <div className="space-y-2">
      {OPTIONS.map(({ key, icon: Icon, title, desc }) => {
        const selected = combo[key];
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              background: selected ? 'rgba(245,214,35,0.1)' : 'var(--bg-elevated)',
              border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                style={{
                  background: selected ? 'var(--lx-accent)' : 'transparent',
                  border: `2px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                }}
              >
                {selected && <Check size={10} style={{ color: 'var(--bg-primary)' }} />}
              </div>
              <Icon size={14} style={{ color: selected ? 'var(--lx-accent)' : 'var(--text-muted)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</span>
            </div>
            <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          </button>
        );
      })}
    </div>
  );
}