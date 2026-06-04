import React, { useState, useEffect } from 'react';
import { Check, Link as LinkIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

const CONTENT_THEMES = [
  'Romance', 'Violence', 'Death/Loss', 'Father-son dynamics', 'Mother-daughter dynamics',
  'Divorce/Separation', 'Addiction', 'War', 'Abuse', 'Mental illness', 'Religion', 'Politics'
];

export default function PrivacyTab({ user }) {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.email) load();
  }, [user]);

  async function load() {
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) setProfile(p[0]);
      else setProfile({ user_email: user.email, is_public: true, show_library: true, show_stats: true, show_reviews: true, show_email: false, show_real_name: false, blacklisted_themes: [], age_filter: 'all' });
    } catch (e) {}
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      if (profile.id) {
        await base44.entities.UserProfile.update(profile.id, profile);
      } else {
        const p = await base44.entities.UserProfile.create({ ...profile, user_email: user.email });
        setProfile(p);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {}
    setSaving(false);
  }

  function toggle(key) {
    setProfile(p => ({ ...p, [key]: !p[key] }));
  }

  function toggleTheme(t) {
    setProfile(p => ({
      ...p,
      blacklisted_themes: p.blacklisted_themes?.includes(t)
        ? p.blacklisted_themes.filter(x => x !== t)
        : [...(p.blacklisted_themes || []), t]
    }));
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const libs = await base44.entities.UserLibrary.filter({ user_email: user.email });
      await Promise.all(libs.map(l => base44.entities.UserLibrary.delete(l.id)));
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      await Promise.all(prefs.map(p => base44.entities.UserPreferences.delete(p.id)));
      if (profile?.id) await base44.entities.UserProfile.delete(profile.id);
      base44.auth.logout();
    } catch (e) {}
    setDeleting(false);
  }

  if (!profile) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const publicUrl = profile.username ? `/u/${profile.username}` : null;

  return (
    <div className="space-y-8">
      {/* Public Profile */}
      <div>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Visibility</h3>
        {publicUrl && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            <LinkIcon size={13} />
            Your public profile: <Link to={publicUrl} className="underline" style={{ color: 'var(--lx-accent)' }}>/u/{profile.username}</Link>
          </div>
        )}
        <div className="space-y-3">
          {[
            { key: 'is_public', label: 'Public Profile', desc: 'Allow others to view your profile' },
            { key: 'show_library', label: 'Show Library', desc: 'Show your book library on your profile' },
            { key: 'show_stats', label: 'Show Reading Stats', desc: 'Show your reading statistics' },
            { key: 'show_reviews', label: 'Show Reviews', desc: 'Show your reviews on your profile' },
            { key: 'show_email', label: 'Show Email Publicly', desc: 'Display your email on your public profile (off by default)' },
            { key: 'show_real_name', label: 'Show Real Name Publicly', desc: 'Display your real name on your public profile (off by default)' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
                style={{ background: profile[key] ? 'var(--lx-accent)' : 'var(--border-strong, #3d3830)' }}
              >
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: profile[key] ? '22px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Age Filter */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Age Filter</h3>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All Ages' }, { value: 'teen', label: 'Teen (13+)' }, { value: 'adult', label: 'Prefer Adult' }].map(opt => (
            <button key={opt.value} onClick={() => setProfile(p => ({ ...p, age_filter: opt.value }))}
              className="text-sm px-3 py-1.5 rounded transition-all"
              style={{
                background: profile.age_filter === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                color: profile.age_filter === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${profile.age_filter === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
              }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Content Filters */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Blacklisted Themes</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Books with these themes will be filtered from your Discover feed.</p>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_THEMES.map(t => {
            const active = profile.blacklisted_themes?.includes(t);
            return (
              <button key={t} onClick={() => toggleTheme(t)}
                className="text-xs px-2.5 py-1 rounded transition-all"
                style={{
                  background: active ? 'rgba(220,38,38,0.2)' : 'var(--bg-elevated)',
                  color: active ? '#f87171' : 'var(--text-secondary)',
                  border: `1px solid ${active ? '#f87171' : 'var(--lx-border)'}`,
                }}>{t}</button>
            );
          })}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="lx-btn-primary">
        {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Privacy Settings'}
      </button>

      {/* Danger Zone */}
      <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 className="font-bold mb-3 text-sm uppercase tracking-wider" style={{ color: '#f87171' }}>Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm px-4 py-2 rounded transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            Delete My Account Data
          </button>
        ) : (
          <div className="p-4 rounded-lg" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' }}>
            <p className="text-sm mb-3" style={{ color: '#f87171' }}>
              This permanently deletes your library, preferences, and profile. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              className="lx-input text-sm mb-3"
              placeholder="Type DELETE"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                disabled={deleteInput !== 'DELETE' || deleting}
                onClick={deleteAccount}
                className="text-sm px-4 py-2 rounded font-bold transition-all"
                style={{
                  background: deleteInput === 'DELETE' ? '#ef4444' : 'rgba(239,68,68,0.3)',
                  color: 'white',
                  opacity: deleting ? 0.6 : 1,
                }}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="lx-btn-ghost text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}