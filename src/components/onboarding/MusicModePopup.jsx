import React, { useState } from 'react';
import { Music as MusicIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { addMusicToMode } from '@/lib/mediaModes';

// One-time popup asking existing users whether they want to add music tracking.
export default function MusicModePopup({ user, profile, currentMode, onDone }) {
  const [saving, setSaving] = useState(false);

  async function markPrompted() {
    if (profile?.id) {
      try { await base44.entities.UserProfile.update(profile.id, { music_prompted: true }); } catch (e) {}
    }
  }

  async function addMusic() {
    setSaving(true);
    try {
      const newMode = addMusicToMode(currentMode);
      const existing = await base44.entities.UserPreferences.filter({ user_email: user.email });
      if (existing[0]) {
        await base44.entities.UserPreferences.update(existing[0].id, { content_mode: newMode });
      } else {
        await base44.entities.UserPreferences.create({ user_email: user.email, content_mode: newMode });
      }
    } catch (e) {}
    await markPrompted();
    setSaving(false);
    onDone();
  }

  async function dismiss() {
    await markPrompted();
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#7c3aed' }}>
            <MusicIcon size={24} style={{ color: 'white' }} />
          </div>
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            🎵 Music is here!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lexio now tracks music too. Search millions of songs, save your favorites to your library, and keep everything — books, movies, and music — in one place. Want to add music to your Lexio?
          </p>
        </div>

        <button onClick={addMusic} disabled={saving} className="lx-btn-primary w-full justify-center">
          {saving ? 'Adding...' : 'Add Music'}
        </button>
        <button onClick={dismiss} className="w-full text-xs py-2 mt-2" style={{ color: 'var(--text-muted)' }}>
          No thanks
        </button>
      </div>
    </div>
  );
}