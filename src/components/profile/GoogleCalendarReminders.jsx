import React, { useState, useEffect } from 'react';
import { Calendar, LogOut, Check, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CONNECTOR_ID = '6a137f90ca344552dcf8ff6d';

export default function GoogleCalendarReminders({ user }) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [days, setDays] = useState([]);
  const [time, setTime] = useState('20:00');
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email) init();
  }, [user]);

  async function init() {
    setChecking(true);
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) {
        setProfile(p[0]);
        setDays(p[0].reading_reminder_days || []);
        setTime(p[0].reading_reminder_time || '20:00');
      } else {
        setProfile({ user_email: user.email });
      }
    } catch (e) {}

    try {
      await base44.functions.invoke('testGcalConnection', {});
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
    setChecking(false);
  }

  async function connect() {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          try {
            await base44.functions.invoke('testGcalConnection', {});
            setConnected(true);
          } catch (e) {
            setConnected(false);
          }
        }
      }, 500);
    } catch (e) {}
  }

  async function disconnect() {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setSaved(false);
    } catch (e) {}
  }

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function saveAndSchedule() {
    if (!days.length) { setError('Select at least one day.'); return; }
    setError('');
    setSaving(true);
    try {
      // Save preferences to UserProfile
      const profileData = { reading_reminder_days: days, reading_reminder_time: time };
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, profileData);
      } else {
        const np = await base44.entities.UserProfile.create({ ...profileData, user_email: user.email });
        setProfile(np);
      }

      // Create actual Google Calendar recurring events
      const res = await base44.functions.invoke('createReadingReminders', {
        days,
        time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
    }
    setSaving(false);
  }

  return (
    <div className="lx-card p-6 mb-8">
      <h2 className="font-display font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Calendar size={18} style={{ color: 'var(--lx-accent)' }} />
        Google Calendar Reminders
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        Connect your Google Calendar and set weekly reading reminders. Events will be created automatically.
      </p>

      {/* Connection Row */}
      <div className="flex items-center justify-between p-3 rounded-lg mb-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: checking ? 'var(--text-muted)' : connected ? '#4ade80' : 'var(--text-muted)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Google Calendar</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {checking ? 'Checking...' : connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {!checking && (
          connected ? (
            <button onClick={disconnect} className="lx-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
              <LogOut size={12} /> Disconnect
            </button>
          ) : (
            <button onClick={connect} className="lx-btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              <Calendar size={12} /> Connect
            </button>
          )
        )}
      </div>

      {/* Reminder Settings — only visible when connected */}
      {connected && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Reading days</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className="text-xs px-3 py-1.5 rounded transition-all"
                  style={{
                    background: days.includes(d) ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                    color: days.includes(d) ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${days.includes(d) ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    fontWeight: days.includes(d) ? 700 : 400,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Reminder time</p>
            <input
              type="time"
              className="lx-input w-auto text-sm"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <button
            onClick={saveAndSchedule}
            disabled={saving || !days.length}
            className="lx-btn-primary"
          >
            {saved
              ? <><Check size={14} /> Reminders scheduled in Google Calendar!</>
              : saving
              ? 'Scheduling...'
              : 'Save and Schedule Reminders'}
          </button>

          {saved && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              A recurring weekly event has been created in your Google Calendar with a 10-minute popup reminder.
            </p>
          )}
        </div>
      )}
    </div>
  );
}