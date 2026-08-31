import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, Trash2, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VerificationKeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const all = await base44.entities.VerificationKey.list('-created_date', 100);
      setKeys(all);
    } catch (e) {
      setError(e?.message || 'Failed to load keys');
    }
    setLoading(false);
  }

  async function createKey() {
    setCreating(true);
    setError('');
    try {
      const res = await base44.functions.invoke('createVerificationKey', { notes });
      const data = res?.data || res;
      setNotes('');
      await loadKeys();
      // auto-copy the new key
      if (data?.key) copy(data.key, 'new');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to create key');
    }
    setCreating(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  }

  async function removeKey(id) {
    if (!confirm('Delete this verification key?')) return;
    await base44.entities.VerificationKey.delete(id);
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Generate one-time "Verified User Workflow Check Keys". A user pastes a key in their Profile to start a Didit identity check — once approved they get a blue verified badge and must use their real name.
      </p>

      <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Notes (optional — who this key is for)</label>
          <input className="lx-input text-sm" placeholder="e.g. Author outreach — Jane Doe"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={createKey} disabled={creating} className="lx-btn-primary text-sm">
          {creating ? 'Generating...' : <><Plus size={13} /> Generate 30-Digit Key</>}
        </button>
        {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Loading keys...</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No keys generated yet.</p>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', opacity: k.is_used ? 0.6 : 1 }}>
              <KeyRound size={14} style={{ color: k.is_used ? 'var(--text-muted)' : 'var(--lx-accent)' }} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate" style={{ color: 'var(--text-primary)' }}>{k.key}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {k.is_used ? `Used by ${k.used_by_email || '—'}` : 'Available'}
                  {k.notes ? ` · ${k.notes}` : ''}
                </p>
              </div>
              <button onClick={() => copy(k.key, k.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {copied === k.id ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
              <button onClick={() => removeKey(k.id)} style={{ color: '#f87171' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}