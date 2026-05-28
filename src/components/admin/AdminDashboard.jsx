import React, { useState, useEffect } from 'react';
import { Shield, Megaphone, Ban, Search, Plus, Trash2, Check, X, AlertTriangle, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ADMIN_TABS = [
  { id: 'safety', label: '🛡️ User Safety' },
  { id: 'broadcasts', label: '📢 Broadcasts' },
  { id: 'patterns', label: '🚫 Blocked Patterns' },
  { id: 'contacts', label: '📬 Contact Requests' },
];

const BAN_FEATURES = [
  { key: 'banned_from_forums', label: 'Forums' },
  { key: 'banned_from_clubs', label: 'Clubs' },
  { key: 'banned_from_comments', label: 'Comments' },
  { key: 'banned_from_discussions', label: 'Discussions' },
  { key: 'banned_from_chat', label: 'Chat' },
];

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
      style={{ background: value ? 'var(--lx-accent)' : 'var(--lx-border)' }}
    >
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: value ? '22px' : '2px' }} />
    </button>
  );
}

// ─── User Safety Tab ───────────────────────────────────────────────────────────
function SafetyTab() {
  const [search, setSearch] = useState('');
  const [safetyRecord, setSafetyRecord] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => { loadAllRecords(); }, []);

  async function loadAllRecords() {
    const records = await base44.entities.UserSafeness.list('-created_date', 100);
    setAllRecords(records);
  }

  async function searchUser() {
    if (!search.trim()) return;
    const results = await base44.entities.UserSafeness.filter({ user_email: search.trim().toLowerCase() });
    if (results[0]) {
      setSafetyRecord(results[0]);
      setForm(results[0]);
    } else {
      setSafetyRecord(null);
      setForm({ user_email: search.trim().toLowerCase(), is_banned: false, ban_reason: '', ban_expires: '', notes: '', banned_from_forums: false, banned_from_clubs: false, banned_from_comments: false, banned_from_discussions: false, banned_from_chat: false });
    }
  }

  async function save() {
    setSaving(true);
    if (safetyRecord?.id) {
      await base44.entities.UserSafeness.update(safetyRecord.id, form);
    } else {
      const created = await base44.entities.UserSafeness.create(form);
      setSafetyRecord(created);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadAllRecords();
    setSaving(false);
  }

  async function deleteRecord() {
    if (!safetyRecord?.id) return;
    if (!confirm('Remove safety record for this user?')) return;
    await base44.entities.UserSafeness.delete(safetyRecord.id);
    setSafetyRecord(null);
    setForm({});
    setSearch('');
    loadAllRecords();
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="flex gap-2">
        <input
          className="lx-input text-sm flex-1"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchUser()}
        />
        <button onClick={searchUser} className="lx-btn-primary px-4 text-sm">
          <Search size={14} />
        </button>
      </div>

      {/* Edit form */}
      {form.user_email && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{form.user_email}</p>
            {safetyRecord?.id && (
              <button onClick={deleteRecord} className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                <Trash2 size={12} /> Remove record
              </button>
            )}
          </div>

          {/* Full ban */}
          <div className="p-3 rounded-lg" style={{ background: form.is_banned ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)', border: `1px solid ${form.is_banned ? 'rgba(248,113,113,0.3)' : 'var(--lx-border)'}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ban size={14} style={{ color: form.is_banned ? '#f87171' : 'var(--text-muted)' }} />
                <span className="text-sm font-bold" style={{ color: form.is_banned ? '#f87171' : 'var(--text-primary)' }}>Full Account Ban</span>
              </div>
              <Toggle value={!!form.is_banned} onChange={v => setForm(f => ({ ...f, is_banned: v }))} />
            </div>
            {form.is_banned && (
              <div className="space-y-2">
                <input className="lx-input text-sm" placeholder="Ban reason (shown to user)..."
                  value={form.ban_reason || ''} onChange={e => setForm(f => ({ ...f, ban_reason: e.target.value }))} />
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Ban expires (leave blank = permanent)</label>
                  <input type="date" className="lx-input text-sm"
                    value={form.ban_expires ? form.ban_expires.slice(0, 10) : ''}
                    onChange={e => setForm(f => ({ ...f, ban_expires: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : '' }))} />
                </div>
              </div>
            )}
          </div>

          {/* Feature restrictions */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Feature Restrictions</p>
            <div className="space-y-2">
              {BAN_FEATURES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Banned from {label}</span>
                  <Toggle value={!!form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Admin Notes (internal)</label>
            <textarea className="lx-input text-sm resize-none" rows={2}
              value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <button onClick={save} disabled={saving} className="lx-btn-primary text-sm">
            {saved ? <><Check size={13} /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* All banned users */}
      {allRecords.filter(r => r.is_banned).length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Currently Banned</p>
          <div className="space-y-2">
            {allRecords.filter(r => r.is_banned).map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer hover:opacity-80"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
                onClick={() => { setSearch(r.user_email); setSafetyRecord(r); setForm(r); }}>
                <div>
                  <span className="font-medium" style={{ color: '#f87171' }}>{r.user_email}</span>
                  {r.ban_expires && <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>expires {new Date(r.ban_expires).toLocaleDateString()}</span>}
                </div>
                <Ban size={13} style={{ color: '#f87171' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Broadcasts Tab ────────────────────────────────────────────────────────────
function BroadcastsTab({ adminEmail }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', is_active: true });
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { loadBroadcasts(); }, []);

  async function loadBroadcasts() {
    const all = await base44.entities.UserBroadcast.list('-created_date', 50);
    setBroadcasts(all);
  }

  async function createBroadcast() {
    if (!form.title.trim()) return;
    setCreating(true);
    await base44.entities.UserBroadcast.create({ ...form, created_by_email: adminEmail });
    setForm({ title: '', body: '', is_active: true });
    setShowNew(false);
    loadBroadcasts();
    setCreating(false);
  }

  async function toggleActive(b) {
    await base44.entities.UserBroadcast.update(b.id, { is_active: !b.is_active });
    setBroadcasts(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function deleteBroadcast(id) {
    await base44.entities.UserBroadcast.delete(id);
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Push announcements to all users' notification bells.</p>
        <button onClick={() => setShowNew(o => !o)} className="lx-btn-primary text-sm">
          <Plus size={13} /> New Broadcast
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <input className="lx-input text-sm" placeholder="Title (required)..."
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="lx-input text-sm resize-none" rows={3} placeholder="Message body..."
            value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={createBroadcast} disabled={creating || !form.title.trim()} className="lx-btn-primary text-sm">
              {creating ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button onClick={() => setShowNew(false)} className="lx-btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {broadcasts.length === 0 && <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No broadcasts yet.</p>}
        {broadcasts.map(b => (
          <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'var(--bg-card)', border: `1px solid ${b.is_active ? 'var(--lx-accent)' : 'var(--lx-border)'}`, opacity: b.is_active ? 1 : 0.5 }}>
            <Megaphone size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--lx-accent)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
              {b.body && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{b.body}</p>}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(b.created_date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(b)} className="text-xs px-2 py-1 rounded"
                style={{ background: b.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)', color: b.is_active ? '#f87171' : '#10b981' }}>
                {b.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => deleteBroadcast(b.id)} style={{ color: '#f87171' }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Blocked Patterns Tab ──────────────────────────────────────────────────────
function PatternsTab() {
  const [patterns, setPatterns] = useState([]);
  const [form, setForm] = useState({ pattern: '', pattern_type: 'email', reason: '', is_active: true });
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadPatterns(); }, []);

  async function loadPatterns() {
    const all = await base44.entities.BlockedPattern.list('-created_date', 100);
    setPatterns(all);
  }

  async function createPattern() {
    if (!form.pattern.trim()) return;
    setCreating(true);
    await base44.entities.BlockedPattern.create(form);
    setForm({ pattern: '', pattern_type: 'email', reason: '', is_active: true });
    setShowNew(false);
    loadPatterns();
    setCreating(false);
  }

  async function togglePattern(p) {
    await base44.entities.BlockedPattern.update(p.id, { is_active: !p.is_active });
    setPatterns(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function deletePattern(id) {
    await base44.entities.BlockedPattern.delete(id);
    setPatterns(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Block emails or usernames matching a pattern.</p>
        <button onClick={() => setShowNew(o => !o)} className="lx-btn-primary text-sm">
          <Plus size={13} /> New Pattern
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <textarea className="lx-input text-sm resize-none" rows={5} placeholder="Pattern (e.g. spam@, badword)..."
            value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))} />
          <div className="flex gap-2 items-center">
            <select className="lx-input text-sm w-32 flex-shrink-0"
              value={form.pattern_type} onChange={e => setForm(f => ({ ...f, pattern_type: e.target.value }))}>
              <option value="email">Email</option>
              <option value="username">Username</option>
            </select>
            <input className="lx-input text-sm flex-1" placeholder="Reason (optional)..."
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={createPattern} disabled={creating || !form.pattern.trim()} className="lx-btn-primary text-sm">
              {creating ? 'Adding...' : 'Add Pattern'}
            </button>
            <button onClick={() => setShowNew(false)} className="lx-btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {patterns.length === 0 && <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No blocked patterns.</p>}
        {patterns.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', opacity: p.is_active ? 1 : 0.5 }}>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{p.pattern_type}</span>
            <span className="flex-1 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{p.pattern}</span>
            {p.reason && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.reason}</span>}
            <button onClick={() => togglePattern(p)} className="text-xs px-2 py-0.5 rounded"
              style={{ background: p.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)', color: p.is_active ? '#f87171' : '#10b981' }}>
              {p.is_active ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => deletePattern(p.id)} style={{ color: '#f87171' }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Requests Tab ─────────────────────────────────────────────────────
function ContactRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [replyForm, setReplyForm] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    const all = await base44.entities.ContactRequest.list('-created_date', 100);
    setRequests(all);
  }

  async function sendReply(req) {
    const reply = replyForm[req.id];
    if (!reply?.trim()) return;
    setSaving(req.id);
    await base44.entities.ContactRequest.update(req.id, { admin_reply: reply, status: 'replied' });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, admin_reply: reply, status: 'replied' } : r));
    setReplyForm(f => ({ ...f, [req.id]: '' }));
    setSaving(null);
  }

  async function closeRequest(id) {
    await base44.entities.ContactRequest.update(id, { status: 'closed' });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'closed' } : r));
  }

  const statusColor = { open: '#f97316', replied: '#10b981', closed: 'var(--text-muted)' };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{requests.length} total request(s)</p>
      {requests.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No contact requests yet.</p>}
      {requests.map(req => (
        <div key={req.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: `1px solid ${req.status === 'open' ? 'rgba(249,115,22,0.4)' : 'var(--lx-border)'}` }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{req.subject}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.user_email} · {new Date(req.created_date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: statusColor[req.status] || 'var(--text-muted)', background: 'var(--bg-elevated)' }}>{req.status}</span>
              {req.status !== 'closed' && (
                <button onClick={() => closeRequest(req.id)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Close</button>
              )}
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{req.message}</p>
          {req.admin_reply && (
            <div className="p-3 rounded text-sm" style={{ background: 'rgba(245,166,35,0.08)', borderLeft: '2px solid var(--lx-accent)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>Your Reply</p>
              <p style={{ color: 'var(--text-secondary)' }}>{req.admin_reply}</p>
            </div>
          )}
          {req.status !== 'closed' && (
            <div className="flex gap-2">
              <input className="lx-input text-sm flex-1" placeholder="Reply to user..."
                value={replyForm[req.id] || ''}
                onChange={e => setReplyForm(f => ({ ...f, [req.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && sendReply(req)}
              />
              <button onClick={() => sendReply(req)} disabled={saving === req.id || !replyForm[req.id]?.trim()} className="lx-btn-primary text-sm px-3">
                {saving === req.id ? '...' : <Mail size={14} />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('safety');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid var(--lx-accent)' }}>
        <Shield size={16} style={{ color: 'var(--lx-accent)' }} />
        <p className="text-sm font-bold" style={{ color: 'var(--lx-accent)' }}>Admin Panel — handle with care</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ADMIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{ background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'safety' && <SafetyTab />}
      {tab === 'broadcasts' && <BroadcastsTab adminEmail={user?.email} />}
      {tab === 'patterns' && <PatternsTab />}
      {tab === 'contacts' && <ContactRequestsTab />}
    </div>
  );
}