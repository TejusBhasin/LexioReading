import React, { useState } from 'react';
import { Film, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const OPTIONS = [
  { value: 'books', title: 'Books Only', desc: 'Keep Lexio focused on reading.' },
  { value: 'books_movies', title: 'Books & Movies', desc: 'Discover, track, and review both books and movies side by side.' },
  { value: 'movies', title: 'Movies Only', desc: 'Switch Lexio to a movie-focused experience.' },
];

// One-time popup shown to existing users announcing movie mode.
export default function MovieModePopup({ user, profile, onDone }) {
  const [choice, setChoice] = useState('books_movies');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const existing = await base44.entities.UserPreferences.filter({ user_email: user.email });
      if (existing[0]) {
        await base44.entities.UserPreferences.update(existing[0].id, { content_mode: choice });
      } else {
        await base44.entities.UserPreferences.create({ user_email: user.email, content_mode: choice });
      }
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, { movie_mode_prompted: true });
      }
    } catch (e) {}
    setSaving(false);
    onDone();
  }

  async function dismiss() {
    if (profile?.id) {
      try { await base44.entities.UserProfile.update(profile.id, { movie_mode_prompted: true }); } catch (e) {}
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#e50914' }}>
            <Film size={24} style={{ color: 'white' }} />
          </div>
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            🎬 Movies are here!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lexio now supports movies alongside books. Discover films, track what you watch, write reviews, and get ratings — all in one place. Choose how you'd like to use Lexio:
          </p>
        </div>

        <div className="space-y-2 mb-5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setChoice(opt.value)}
              className="w-full text-left p-3 rounded-lg transition-all"
              style={{
                background: choice === opt.value ? 'rgba(245,214,35,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${choice === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: choice === opt.value ? 'var(--lx-accent)' : 'transparent',
                    border: `2px solid ${choice === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  }}
                >
                  {choice === opt.value && <Check size={10} style={{ color: 'var(--bg-primary)' }} />}
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{opt.title}</span>
              </div>
              <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        <button onClick={save} disabled={saving} className="lx-btn-primary w-full justify-center">
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
        <button onClick={dismiss} className="w-full text-xs py-2 mt-2" style={{ color: 'var(--text-muted)' }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}