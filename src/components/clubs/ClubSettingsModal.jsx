import React, { useState } from 'react';
import { X, Eye, EyeOff, Key, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ClubSettingsModal({ club, onClose, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    name: club.name || '',
    description: club.description || '',
    current_book_title: club.current_book_title || '',
    is_visible: club.is_visible !== false,
    allow_chat: club.allow_chat !== false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    const updated = await base44.entities.ReadingClub.update(club.id, form);
    onUpdate(updated);
    setSaving(false);
    onClose();
  }

  async function deleteClub() {
    if (!confirm('Delete this club permanently? This cannot be undone.')) return;
    setDeleting(true);
    await base44.entities.ReadingClub.delete(club.id);
    onDelete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-xl p-6 my-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Club Settings</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Name</label>
            <input className="lx-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea className="lx-input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Current Book (title)</label>
            <input className="lx-input" placeholder="e.g. The Great Gatsby" value={form.current_book_title} onChange={e => setForm(f => ({ ...f, current_book_title: e.target.value }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Visible to public</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Show club in public listing</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
              className="w-11 h-6 rounded-full relative transition-all"
              style={{ background: form.is_visible ? 'var(--lx-accent)' : 'var(--border-strong)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: form.is_visible ? '22px' : '2px' }} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Allow chat</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Members can post in discussion chains</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, allow_chat: !f.allow_chat }))}
              className="w-11 h-6 rounded-full relative transition-all"
              style={{ background: form.allow_chat ? 'var(--lx-accent)' : 'var(--border-strong)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: form.allow_chat ? '22px' : '2px' }} />
            </button>
          </div>

          {club.join_code && (
            <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'var(--bg-elevated)' }}>
              <Key size={14} style={{ color: 'var(--lx-accent)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Join Code</p>
                <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{club.join_code}</p>
              </div>
            </div>
          )}

          <button onClick={save} disabled={saving} className="lx-btn-primary w-full justify-center text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button onClick={deleteClub} disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all"
            style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent' }}>
            <Trash2 size={13} /> {deleting ? 'Deleting...' : 'Delete Club'}
          </button>
        </div>
      </div>
    </div>
  );
}