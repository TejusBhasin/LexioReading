import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Copy, Loader2, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolCreationCodesTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('manageSchoolCreationCodes', { action: 'list' });
      setCodes(res.data?.codes || []);
    } catch (e) {}
    setLoading(false);
  }

  async function createCode() {
    setCreating(true);
    try {
      const res = await base44.functions.invoke('manageSchoolCreationCodes', { action: 'create', notes });
      setCodes(prev => [res.data.code, ...prev]);
      setNotes('');
      setShowNew(false);
    } catch (e) {}
    setCreating(false);
  }

  async function deactivateCode(id) {
    try {
      await base44.functions.invoke('manageSchoolCreationCodes', { action: 'deactivate', code_id: id });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
    } catch (e) {}
  }

  async function deleteCode(id) {
    if (!confirm('Delete this code permanently?')) return;
    try {
      await base44.functions.invoke('manageSchoolCreationCodes', { action: 'delete', code_id: id });
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch (e) {}
  }

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate 300-character codes that allow users to create a school.</p>
        <button onClick={() => setShowNew(o => !o)} className="lx-btn-primary text-sm">
          <Plus size={13} /> New Code
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <input className="lx-input text-sm" placeholder="Notes (optional, e.g. 'For Lincoln High')" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={createCode} disabled={creating} className="lx-btn-primary text-sm">
              {creating ? <><Loader2 size={13} className="animate-spin" /> Generating...</> : 'Generate Code'}
            </button>
            <button onClick={() => setShowNew(false)} className="lx-btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lx-accent)' }} /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-8">
          <KeyRound size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No codes generated yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: `1px solid ${c.is_active && !c.is_used ? 'var(--lx-accent)' : 'var(--lx-border)'}`, opacity: c.is_active ? 1 : 0.5 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {c.is_used ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Used</span>
                  ) : c.is_active ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Active</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Inactive</span>
                  )}
                  {c.notes && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.notes}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {c.is_active && !c.is_used && (
                    <button onClick={() => deactivateCode(c.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      Deactivate
                    </button>
                  )}
                  <button onClick={() => deleteCode(c.id)} style={{ color: '#f87171' }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all p-2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', maxHeight: 60, overflowY: 'auto' }}>
                  {c.code}
                </code>
                <button onClick={() => copyCode(c.code, c.id)} className="flex-shrink-0 p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                  {copiedId === c.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
              {c.is_used && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Used by {c.used_by_email} · School: {c.school_name || 'Unknown'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}