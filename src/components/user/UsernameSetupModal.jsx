import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function UsernameSetupModal({ user, onComplete, onClose }) {
  const [username, setUsername] = useState('');
  const [tcAgreed, setTcAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!username.trim() || !tcAgreed) return;
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) { setError('Username must be at least 3 characters.'); return; }
    setSaving(true);
    setError('');
    try {
      const existing = await base44.entities.UserProfile.filter({ username: clean });
      if (existing.length > 0) { setError('Username already taken.'); setSaving(false); return; }

      const myProfile = await base44.entities.UserProfile.filter({ user_email: user.email });
      let profile;
      if (myProfile[0]) {
        profile = await base44.entities.UserProfile.update(myProfile[0].id, { username: clean, tc_agreed: true, tc_agreed_date: new Date().toISOString() });
      } else {
        profile = await base44.entities.UserProfile.create({ user_email: user.email, username: clean, tc_agreed: true, tc_agreed_date: new Date().toISOString() });
      }
      onComplete(profile);
    } catch (e) { setError('Something went wrong.'); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Choose a Username</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          You need a username to post reviews and join discussions.
        </p>
        <input
          className="lx-input mb-3"
          placeholder="e.g. bookworm42"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={20}
        />
        {error && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{error}</p>}

        <label className="flex items-center gap-2 cursor-pointer mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <button onClick={() => setTcAgreed(!tcAgreed)}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: tcAgreed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${tcAgreed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            {tcAgreed && <Check size={12} style={{ color: 'var(--bg-primary)' }} />}
          </button>
          I agree to the Terms & Conditions
        </label>

        <button onClick={save} disabled={!username || username.length < 3 || !tcAgreed || saving}
          className="lx-btn-primary w-full justify-center">
          {saving ? 'Saving...' : 'Set Username'}
        </button>
      </div>
    </div>
  );
}