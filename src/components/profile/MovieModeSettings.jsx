import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MediaModePicker from '@/components/media/MediaModePicker';

// Profile settings component to adjust media preferences (books/movies/music).
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
        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Media in Lexio</p>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Choose which media types appear across Discover, your library, and reviews. Pick any combination of books, movies, and music.
      </p>
      <div className="mb-3">
        <MediaModePicker value={choice} onChange={(v) => { setChoice(v); save(v); }} />
      </div>
      {saved && <p className="text-xs" style={{ color: 'var(--lx-accent)' }}>Saved!</p>}
    </div>
  );
}