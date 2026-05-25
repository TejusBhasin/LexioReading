import React, { useState, useEffect } from 'react';
import { Check, Link as LinkIcon, Calendar, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CONTENT_THEMES = [
  'Romance', 'Violence', 'Death/Loss', 'Father-son dynamics', 'Mother-daughter dynamics',
  'Divorce/Separation', 'Addiction', 'War', 'Abuse', 'Mental illness', 'Religion', 'Politics'
];

const CONNECTOR_ID = '6a137f90ca344552dcf8ff6d'; // Lexio Reading Reminders

export default function PrivacyTab({ user, showOnlyGcal = false }) {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalChecking, setGcalChecking] = useState(false);

  useEffect(() => {
    if (user?.email) load();
  }, [user]);

  async function load() {
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) setProfile(p[0]);
      else setProfile({ user_email: user.email, is_public: true, show_library: true, show_stats: true, show_reviews: true, blacklisted_themes: [], age_filter: 'all', reading_reminder_days: [], reading_reminder_time: '20:00' });
      checkGcalConnection();
    } catch (e) {}
  }

  async function checkGcalConnection() {
    setGcalChecking(true);
    try {
      // Try calling a backend function that uses the connector — if it fails, user isn't connected
      await base44.functions.invoke('testGcalConnection', {});
      setGcalConnected(true);
    } catch (e) {
      setGcalConnected(false);
    }
    setGcalChecking(false);
  }

  async function connectGcal() {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkGcalConnection();
        }
      }, 500);
    } catch (e) {}
  }

  async function disconnectGcal() {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setGcalConnected(false);
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
    setProfile(p => ({ ...p, blacklisted_themes: p.blacklisted_themes?.includes(t) ? p.blacklisted_themes.filter(x => x !== t) : [...(p.blacklisted_themes || []), t] }));
  }
  function toggleDay(d) {
    setProfile(p => ({ ...p, reading_reminder_days: p.reading_reminder_days?.includes(d) ? p.reading_reminder_days.filter(x => x !== d) : [...(p.reading_reminder_days || []), d] }));
  }

  if (!profile) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const publicUrl = profile.username ? `/u/${profile.username}` : null;

  if (showOnlyGcal) {
    return (
      <div className="lx-card p-6 mb-8">
        <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Calendar size={18} style={{ color: 'var(--lx-accent)' }} />
          Google Calendar Integration
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Connect Google Calendar to receive personalized reading reminders.</p>
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: gcalConnected ? 'var(--lx-accent)' : 'var(--text-muted)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Google Calendar</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {gcalConnected ? 'Connected - reminders enabled' : 'Click to connect and set up reminders'}
                </p>
              </div>
            </div>
            {gcalChecking ? (
              <button disabled className="text-xs px-3 py-1.5" style={{ color: 'var(--text-muted)' }}>...</button>
            ) : gcalConnected ? (
              <button onClick={disconnectGcal} className="lx-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                <LogOut size={12} /> Disconnect
              </button>
            ) : (
              <button onClick={connectGcal} className="lx-btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Calendar size={12} /> Connect
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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

      {/* Reading Reminders */}
      <div>
       <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Reading Reminders</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Set your preferred reading days and time. Connect Google Calendar to receive reminders.</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {DAYS.map(d => (
            <button key={d} onClick={() => toggleDay(d)}
              className="text-xs px-3 py-1.5 rounded transition-all"
              style={{
                background: profile.reading_reminder_days?.includes(d) ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                color: profile.reading_reminder_days?.includes(d) ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${profile.reading_reminder_days?.includes(d) ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
              }}>{d}</button>
          ))}
        </div>
        <input type="time" className="lx-input w-auto text-sm"
          value={profile.reading_reminder_time || '20:00'}
          onChange={e => setProfile(p => ({ ...p, reading_reminder_time: e.target.value }))} />


      </div>

      <button onClick={save} disabled={saving} className="lx-btn-primary">
        {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Privacy Settings'}
      </button>
    </div>
  );
}