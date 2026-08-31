import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BadgeCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VerifiedUsersTab({ adminEmail }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const all = await base44.entities.VerifiedUser.list('-created_date', 200);
      setUsers(all);
    } catch (e) {
      setError(e?.message || 'Failed to load');
    }
    setLoading(false);
  }

  async function addUser() {
    setError('');
    const em = email.trim().toLowerCase();
    if (!em) return;
    if (users.some(u => (u.user_email || '').toLowerCase() === em)) {
      setError('That user already has a blue checkmark.');
      return;
    }
    setAdding(true);
    try {
      // Resolve the user's current username for display + profile link
      let username = em.split('@')[0];
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: em });
        if (profiles[0]?.username) username = profiles[0].username;
      } catch (e) {}
      await base44.entities.VerifiedUser.create({
        user_email: em,
        username,
        added_by_email: adminEmail,
        added_at: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      setEmail('');
      setNotes('');
      await loadUsers();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to add user');
    }
    setAdding(false);
  }

  async function removeUser(id) {
    if (!confirm('Remove the blue checkmark from this user?')) return;
    await base44.entities.VerifiedUser.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Manually grant a blue verified checkmark to any user. They'll show the badge and their username links to their profile everywhere. Add or remove people here at any time.
      </p>

      <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>User Email *</label>
          <input className="lx-input text-sm" placeholder="user@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Notes (optional)</label>
          <input className="lx-input text-sm" placeholder="e.g. Author, partner, staff"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={addUser} disabled={adding || !email.trim()} className="lx-btn-primary text-sm">
          {adding ? 'Adding...' : <><Plus size={13} /> Grant Blue Checkmark</>}
        </button>
        {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No manually-verified users yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
              <BadgeCheck size={15} style={{ color: '#3b82f6' }} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.username || u.user_email}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.user_email}{u.notes ? ` · ${u.notes}` : ''}</p>
              </div>
              <button onClick={() => removeUser(u.id)} style={{ color: '#f87171' }} title="Remove checkmark"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}