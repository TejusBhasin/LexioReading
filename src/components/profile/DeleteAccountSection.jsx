import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DeleteAccountSection({ user }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [input, setInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    try {
      const [libs, prefs, profiles] = await Promise.all([
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.UserPreferences.filter({ user_email: user.email }),
        base44.entities.UserProfile.filter({ user_email: user.email }),
      ]);
      await Promise.all([
        ...libs.map(l => base44.entities.UserLibrary.delete(l.id)),
        ...prefs.map(p => base44.entities.UserPreferences.delete(p.id)),
        ...profiles.map(p => base44.entities.UserProfile.delete(p.id)),
      ]);
      base44.auth.logout();
    } catch (e) {}
    setDeleting(false);
  }

  return (
    <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
      <h3 className="font-bold mb-1 flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: '#f87171' }}>
        <Trash2 size={14} /> Danger Zone
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Permanently delete your account and all data. This cannot be undone.</p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm px-4 py-2 rounded transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          Delete My Account &amp; Data
        </button>
      ) : (
        <div className="p-4 rounded-lg" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' }}>
          <p className="text-sm mb-3" style={{ color: '#f87171' }}>
            Type <strong>DELETE</strong> to permanently remove your library, preferences, and profile.
          </p>
          <input
            className="lx-input text-sm mb-3"
            placeholder="Type DELETE"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              disabled={input !== 'DELETE' || deleting}
              onClick={deleteAccount}
              className="text-sm px-4 py-2 rounded font-bold transition-all"
              style={{
                background: input === 'DELETE' ? '#ef4444' : 'rgba(239,68,68,0.3)',
                color: 'white',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button onClick={() => { setShowConfirm(false); setInput(''); }} className="lx-btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}