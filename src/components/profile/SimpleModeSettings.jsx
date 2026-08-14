import React from 'react';
import { Check, EyeOff, Eye } from 'lucide-react';
import { SIMPLE_MODE_TABS, SIMPLE_MODE_GENRES, SIMPLE_MODE_MOODS, ALL_HIDEABLE_TABS } from '@/lib/theme';

export default function SimpleModeSettings({ prefs, setPrefs }) {
  function toggleSimpleMode() {
    setPrefs(p => {
      if (!p.simple_mode) {
        return { ...p, simple_mode: true, hidden_tabs: [...SIMPLE_MODE_TABS], hidden_genres: [...SIMPLE_MODE_GENRES], hidden_moods: [...SIMPLE_MODE_MOODS] };
      }
      return { ...p, simple_mode: false, hidden_tabs: [], hidden_genres: [], hidden_moods: [] };
    });
  }

  function toggleHiddenTab(path) {
    setPrefs(p => {
      const hidden = p.hidden_tabs || [];
      return { ...p, hidden_tabs: hidden.includes(path) ? hidden.filter(t => t !== path) : [...hidden, path] };
    });
  }

  function toggleHiddenGenre(g) {
    setPrefs(p => {
      const hidden = p.hidden_genres || [];
      return { ...p, hidden_genres: hidden.includes(g) ? hidden.filter(x => x !== g) : [...hidden, g] };
    });
  }

  function toggleHiddenMood(m) {
    setPrefs(p => {
      const hidden = p.hidden_moods || [];
      return { ...p, hidden_moods: hidden.includes(m) ? hidden.filter(x => x !== m) : [...hidden, m] };
    });
  }

  return (
    <div className="space-y-6">
      {/* Simple Mode Toggle */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Simple Mode
        </h3>
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Simple Mode</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Removes Clubs, Forums & Reviews tabs. Hides Romance, Horror, Self-Help & True Crime genres, and removes Dark & Intense, Emotional, Cozy, Escapist & Nostalgic moods.
            </p>
          </div>
          <button
            onClick={toggleSimpleMode}
            className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
            style={{ background: prefs.simple_mode ? 'var(--lx-accent)' : 'var(--border-strong)' }}
          >
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: prefs.simple_mode ? '22px' : '2px' }} />
          </button>
        </div>
      </div>

      {/* Hide Tabs */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <EyeOff size={14} /> Hide Tabs from Menu
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Tabs are hidden from navigation until re-enabled here. Pages remain accessible by direct link.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_HIDEABLE_TABS.map(({ path, label }) => {
            const hidden = (prefs.hidden_tabs || []).includes(path);
            return (
              <button key={path} onClick={() => toggleHiddenTab(path)}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: hidden ? 'rgba(220,38,38,0.15)' : 'var(--bg-elevated)',
                  color: hidden ? '#f87171' : 'var(--text-secondary)',
                  border: `1px solid ${hidden ? '#f87171' : 'var(--lx-border)'}`,
                }}>
                {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hide Genres */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Hidden Genres</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          These genres won't be promoted in recommendations, but books in these genres remain searchable.
        </p>
        <div className="flex flex-wrap gap-2">
          {SIMPLE_MODE_GENRES.map(g => {
            const hidden = (prefs.hidden_genres || []).includes(g);
            return (
              <button key={g} onClick={() => toggleHiddenGenre(g)}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                style={{
                  background: hidden ? 'rgba(220,38,38,0.15)' : 'var(--bg-elevated)',
                  color: hidden ? '#f87171' : 'var(--text-secondary)',
                  border: `1px solid ${hidden ? '#f87171' : 'var(--lx-border)'}`,
                }}>
                {hidden && <Check size={11} className="inline mr-1" />}
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hide Moods */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Hidden Moods</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          These mood options are removed from your reading mood selections.
        </p>
        <div className="flex flex-wrap gap-2">
          {SIMPLE_MODE_MOODS.map(m => {
            const hidden = (prefs.hidden_moods || []).includes(m);
            return (
              <button key={m} onClick={() => toggleHiddenMood(m)}
                className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                style={{
                  background: hidden ? 'rgba(220,38,38,0.15)' : 'var(--bg-elevated)',
                  color: hidden ? '#f87171' : 'var(--text-secondary)',
                  border: `1px solid ${hidden ? '#f87171' : 'var(--lx-border)'}`,
                }}>
                {hidden && <Check size={11} className="inline mr-1" />}
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}