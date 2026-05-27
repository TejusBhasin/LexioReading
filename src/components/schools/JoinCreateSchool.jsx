import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, LogIn, AlertTriangle, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FEATURE_LABELS = {
  vault: 'Vault',
  forums: 'Forums',
  clubs: 'Clubs',
  chat: 'AI Chat',
  reviews: 'Reviews',
  wrapped: 'Wrapped',
  discover: 'Discover',
};

export default function JoinCreateSchool({ user }) {
  const [schoolMember, setSchoolMember] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // 'join' | 'create' | null
  const [joinCode, setJoinCode] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const members = await base44.entities.SchoolMember.filter({ user_email: user.email, kicked: false });
      if (members[0]) {
        setSchoolMember(members[0]);
        const schools = await base44.entities.School.filter({ id: members[0].school_id });
        if (schools[0]) setSchool(schools[0]);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function joinSchool() {
    if (!joinCode.trim() || !confirmed) return;
    setSaving(true);
    setError('');
    try {
      const schools = await base44.entities.School.filter({ join_code: joinCode.trim().toUpperCase() });
      if (!schools[0]) { setError('Invalid join code.'); setSaving(false); return; }
      const s = schools[0];
      // Check not already member
      const existing = await base44.entities.SchoolMember.filter({ school_id: s.id, user_email: user.email });
      if (existing[0] && !existing[0].kicked) { setError('You are already in this school.'); setSaving(false); return; }
      const m = await base44.entities.SchoolMember.create({
        school_id: s.id,
        school_name: s.name,
        user_email: user.email,
        username: user.full_name || user.email,
        role: 'member',
        joined_date: new Date().toISOString(),
        kicked: false,
      });
      await base44.entities.School.update(s.id, { member_count: (s.member_count || 1) + 1 });
      setSchoolMember(m);
      setSchool(s);
      setMode(null);
    } catch (e) { setError('Failed to join. Try again.'); }
    setSaving(false);
  }

  async function createSchool() {
    if (!createForm.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const code = Math.random().toString(36).slice(2, 7).toUpperCase();
      const s = await base44.entities.School.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        creator_email: user.email,
        join_code: code,
        theme_primary: '#f5a623',
        theme_accent: '#e8854a',
        theme_secondary: '#1a1a1a',
        theme_locked: true,
        restrictions: [],
        member_count: 1,
        is_active: true,
      });
      const m = await base44.entities.SchoolMember.create({
        school_id: s.id,
        school_name: s.name,
        user_email: user.email,
        username: user.full_name || user.email,
        role: 'admin',
        joined_date: new Date().toISOString(),
        kicked: false,
      });
      setSchoolMember(m);
      setSchool(s);
      setMode(null);
    } catch (e) { setError('Failed to create school.'); }
    setSaving(false);
  }

  if (loading) return <div className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />;

  // Enrolled view
  if (school && schoolMember) {
    const isAdmin = schoolMember.role === 'admin';
    return (
      <div className="lx-card p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: school.theme_primary || 'var(--lx-accent)', color: '#000' }}>
            <GraduationCap size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{school.name}</p>
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: isAdmin ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: isAdmin ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
            {school.description && <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{school.description}</p>}
            {isAdmin && (
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--lx-accent)' }}>Join code: {school.join_code}</p>
            )}
            {school.restrictions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {school.restrictions.map(r => (
                  <span key={r} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                    {FEATURE_LABELS[r] || r} restricted
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!isAdmin && (
          <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} /> School membership is permanent. Contact your admin if you have concerns.
          </p>
        )}
      </div>
    );
  }

  // No school enrolled
  if (!mode) {
    return (
      <div className="lx-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={18} style={{ color: 'var(--lx-accent)' }} />
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>School</p>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Join or create a school to collaborate with classmates under a managed environment.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setMode('join')} className="lx-btn-ghost flex-1 justify-center text-sm">
            <LogIn size={14} /> Join a School
          </button>
          <button onClick={() => setMode('create')} className="lx-btn-primary flex-1 justify-center text-sm">
            <Plus size={14} /> Create a School
          </button>
        </div>
      </div>
    );
  }

  // Join form
  if (mode === 'join') {
    return (
      <div className="lx-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Join a School</p>
          <button onClick={() => { setMode(null); setError(''); setConfirmed(false); }}><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <p className="text-xs" style={{ color: '#f87171' }}>
            <strong>Important:</strong> Once you join a school, you cannot leave it. Your account will be managed by the school admin, who may apply theme restrictions and feature limits.
          </p>
        </div>
        <input className="lx-input mb-3 text-sm font-mono uppercase tracking-widest" placeholder="Enter 5-character join code"
          value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={5} />
        <label className="flex items-start gap-2 cursor-pointer mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <button onClick={() => setConfirmed(!confirmed)}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{ background: confirmed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${confirmed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            {confirmed && <Check size={11} style={{ color: 'var(--bg-primary)' }} />}
          </button>
          I understand that joining a school is permanent and my account may be managed by the school admin.
        </label>
        {error && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{error}</p>}
        <button onClick={joinSchool} disabled={saving || !joinCode.trim() || !confirmed} className="lx-btn-primary w-full justify-center">
          {saving ? 'Joining...' : 'Join School'}
        </button>
      </div>
    );
  }

  // Create form
  return (
    <div className="lx-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Create a School</p>
        <button onClick={() => { setMode(null); setError(''); }}><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>School Name *</label>
          <input className="lx-input text-sm" placeholder="e.g. Lincoln High Book Club" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label>
          <textarea className="lx-input text-sm resize-none" rows={2} placeholder="Brief description..." value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>
      {error && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{error}</p>}
      <button onClick={createSchool} disabled={saving || !createForm.name.trim()} className="lx-btn-primary w-full justify-center">
        {saving ? 'Creating...' : 'Create School'}
      </button>
    </div>
  );
}