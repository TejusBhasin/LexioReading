import React from 'react';
import { Feather, ArrowRight } from 'lucide-react';

const STYLES = [
  { id: 'First Person', emoji: '🗣️', desc: 'Told through one character’s eyes' },
  { id: 'Third Person Limited', emoji: '👁️', desc: 'Follows one character, he/she/they' },
  { id: 'Third Person Omniscient', emoji: '🌐', desc: 'Narrator knows all thoughts' },
  { id: 'Second Person', emoji: '🫵', desc: 'Immersive “you” perspective' },
  { id: 'Epistolary', emoji: '✉️', desc: 'Letters, diary entries, documents' },
  { id: 'Stream of Consciousness', emoji: '🧠', desc: 'Flowing inner thoughts' },
  { id: 'Lyrical', emoji: '🎵', desc: 'Poetic, descriptive, musical prose' },
  { id: 'Minimalist', emoji: '✂️', desc: 'Sparse, clean, Hemingway-esque' },
  { id: 'Cinematic', emoji: '🎬', desc: 'Vivid, visual, scene-driven' },
  { id: 'Conversational', emoji: '💬', desc: 'Casual, witty, relatable' },
  { id: 'Classic', emoji: '📜', desc: 'Formal, structured, traditional' },
  { id: 'Humorous', emoji: '😄', desc: 'Light, funny, playful tone' },
];

export default function StyleSelect({ genre, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
        <Feather size={18} style={{ color: 'var(--lx-accent)' }} />
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Writing Style</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
        <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Choose a writing style
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          How should your book be written? You can refine this further in the chat.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {STYLES.map(({ id, emoji, desc }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex items-start gap-3 px-3 py-3 rounded-xl text-sm transition-all hover:opacity-90 text-left"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--lx-border)',
              }}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
              <div className="flex-1">
                <div className="font-medium">{id}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <ArrowRight size={13} className="mt-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
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