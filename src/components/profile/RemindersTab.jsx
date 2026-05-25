import React, { useState, useEffect } from 'react';
import { Check, MessageCircle, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RemindersTab({ user }) {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState([]);
  const [time, setTime] = useState('20:00');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.email) load();
  }, [user]);

  async function load() {
    const p = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (p[0]) {
      setProfile(p[0]);
      setPhone(p[0].whatsapp_phone || '');
      setEnabled(p[0].whatsapp_reminders_enabled || false);
      setDays(p[0].reading_reminder_days || []);
      setTime(p[0].reading_reminder_time || '20:00');
    } else {
      setProfile({ user_email: user.email });
    }
  }

  async function save() {
    setSaving(true);
    const data = {
      whatsapp_phone: phone,
      whatsapp_reminders_enabled: enabled,
      reading_reminder_days: days,
      reading_reminder_time: time,
    };
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, data);
    } else {
      const np = await base44.entities.UserProfile.create({ ...data, user_email: user.email });
      setProfile(np);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  return (
    <div className="space-y-8">
      {/* WhatsApp Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle size={18} style={{ color: '#25D366' }} />
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>WhatsApp Reminders</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Get a WhatsApp message on your chosen days to remind you to read.
        </p>

        <div className="space-y-4">
          {/* Phone number */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
              WhatsApp phone number (with country code)
            </label>
            <input
              className="lx-input"
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Example: +14155552671 (US), +447911123456 (UK)
            </p>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable WhatsApp reminders</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Receive reminder messages on selected days</p>
            </div>
            <button
              onClick={() => setEnabled(e => !e)}
              className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
              style={{ background: enabled ? 'var(--lx-accent)' : 'var(--border-strong, #3d3830)' }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: enabled ? '22px' : '2px' }} />
            </button>
          </div>

          {/* Days */}
          {enabled && (
            <>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Reminder days</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className="text-xs px-3 py-1.5 rounded transition-all"
                      style={{
                        background: days.includes(d) ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                        color: days.includes(d) ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${days.includes(d) ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                        fontWeight: days.includes(d) ? 700 : 400,
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Reminder time</p>
                <input
                  type="time"
                  className="lx-input w-auto"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="lx-btn-primary">
        {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Reminder Settings'}
      </button>

      {saved && enabled && phone && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          ✅ Your reminder preferences are saved. You'll receive WhatsApp messages on your selected days once the system is activated.
        </p>
      )}
    </div>
  );
}