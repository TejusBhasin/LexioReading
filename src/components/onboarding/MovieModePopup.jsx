import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import MediaModePicker from '@/components/media/MediaModePicker';

// One-time popup shown to existing users announcing movie & music support.
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
        await base44.entities.UserProfile.update(profile.id, { movie_mode_prompted: true, music_prompted: true });
      }
    } catch (e) {}
    setSaving(false);
    onDone();
  }

  async function dismiss() {
    if (profile?.id) {
      try { await base44.entities.UserProfile.update(profile.id, { movie_mode_prompted: true, music_prompted: true }); } catch (e) {}
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-4">
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            🎬 Movies & 🎵 Music are here!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lexio now supports movies and music alongside books. Discover films and songs, track what you watch and listen to, and review it all in one place. Pick any combination of what you'd like to track:
          </p>
        </div>

        <div className="mb-5">
          <MediaModePicker value={choice} onChange={setChoice} />
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