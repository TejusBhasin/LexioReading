import React, { useState } from 'react';
import { Film, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const OPTIONS = [
  { value: 'books', title: 'Books Only', desc: 'Keep Lexio focused on reading.' },
  { value: 'books_movies', title: 'Books & Movies', desc: 'Discover and track both books and movies.' },
  { value: 'movies', title: 'Movies Only', desc: 'Switch Lexio to a movie-focused experience.' },
];

// Profile settings component to adjust movie mode preference.
export default function MovieModeSettings({ prefs, onUpdated }) {
  const [choice, setChoice] = useState(prefs?.content_mode || 'books');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(value) {
    setSaving(true);
    try {
      if (prefs?.id) {
        await base44.entities.UserPreferences.update(prefs.id, { content_mode: value });
      } else if (prefs?.user_email) {
        await base44.entities.UserPreferences.create({ user_email: prefs.user_email, content_mode: value });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUpdated) onUpdated({ ...prefs, content_mode: value });
    } catch (e) {}
    setSaving(false);
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Film size={16} style={{ color: '#e50914' }} />
        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Movies in Lexio</p>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Choose which media types appear across Discover, your library, and reviews.
      </p>
      <div className="space-y-2 mb-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setChoice(opt.value); save(opt.value); }}
            className="w-full text-left p-2.5 rounded-lg transition-all"
            style={{
              background: choice === opt.value ? 'rgba(245,214,35,0.1)' : 'var(--bg-elevated)',
              border: `1px solid ${choice === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: choice === opt.value ? 'var(--lx-accent)' : 'transparent',
                  border: `2px solid ${choice === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                }}
              >
                {choice === opt.value && <Check size={10} style={{ color: 'var(--bg-primary)' }} />}
              </div>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{opt.title}</span>
            </div>
            <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
          </button>
        ))}
      </div>
      {saved && <p className="text-xs" style={{ color: 'var(--lx-accent)' }}>Saved!</p>}
    </div>
  );
}