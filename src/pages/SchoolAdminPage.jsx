import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Users, Settings, BarChart2, Trash2, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const FEATURE_LABELS = {
  vault: 'Vault',
  forums: 'Forums',
  clubs: 'Clubs',
  chat: 'AI Chat',
  reviews: 'Reviews',
  wrapped: 'Wrapped',
  discover: 'Discover',
};
const ALL_FEATURES = Object.keys(FEATURE_LABELS);

export default function SchoolAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberLogs, setMemberLogs] = useState({});
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeForm, setThemeForm] = useState({});
  const [restrictions, setRestrictions] = useState([]);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      // Find school where user is admin
      const allMembers = await base44.entities.SchoolMember.filter({ user_email: user.email, role: 'admin' });
      if (!allMembers[0]) { setLoading(false); return; }
      const schools = await base44.entities.School.filter({ id: allMembers[0].school_id });
      if (!schools[0]) { setLoading(false); return; }
      const s = schools[0];
      setSchool(s);
      setThemeForm({ theme_primary: s.theme_primary, theme_accent: s.theme_accent, theme_secondary: s.theme_secondary });
      setRestrictions(s.restrictions || []);

      const mems = await base44.entities.SchoolMember.filter({ school_id: s.id });
      setMembers(mems);

      // Fetch reading logs for all members
      const logs = {};
      await Promise.all(mems.map(async m => {
        const l = await base44.entities.ReadingLog.filter({ user_email: m.user_email });
        logs[m.user_email] = l;
      }));
      setMemberLogs(logs);
    } catch (e) {}
    setLoading(false);
  }

  async function saveTheme() {
    if (!school) return;
    setSaving(true);
    await base44.entities.School.update(school.id, { ...themeForm, restrictions });
    setSchool(s => ({ ...s, ...themeForm, restrictions }));
    setSaving(false);
  }

  async function kickMember(member) {
    if (!confirm(`Remove ${member.user_email} from the school? They will return to normal mode.`)) return;
    await base44.entities.SchoolMember.update(member.id, { kicked: true });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, kicked: true } : m));
  }

  async function reinstateMemeber(member) {
    await base44.entities.SchoolMember.update(member.id, { kicked: false });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, kicked: false } : m));
  }

  async function deleteSchool() {
    if (!confirm('Delete this school? All members will return to normal mode. This cannot be undone.')) return;
    // Mark all members as kicked (returns them to normal)
    await Promise.all(members.map(m => base44.entities.SchoolMember.update(m.id, { kicked: true })));
    await base44.entities.School.update(school.id, { is_active: false });
    navigate('/profile');
  }

  function toggleRestriction(feat) {
    setRestrictions(prev => prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!school) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <GraduationCap size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No School Found</p>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>You don't manage any school yet.</p>
      <button onClick={() => navigate('/profile')} className="lx-btn-ghost">← Back to Profile</button>
    </div>
  );

  const activeMembers = members.filter(m => !m.kicked);
  const totalLogs = Object.values(memberLogs).flat().length;
  const totalMinutes = Object.values(memberLogs).flat().reduce((s, l) => s + (l.time_spent_minutes || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate('/profile')} className="lx-btn-ghost text-sm mb-6 py-1.5 px-3">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: school.theme_primary, color: '#000' }}>
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{school.name}</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--lx-accent)' }}>Join Code: {school.join_code}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Members', value: activeMembers.length },
              { label: 'Total Sessions', value: totalLogs },
              { label: 'Total Minutes', value: totalMinutes },
              { label: 'Avg/Member', value: activeMembers.length > 0 ? Math.round(totalMinutes / activeMembers.length) + 'm' : '—' },
            ].map(s => (
              <div key={s.label} className="lx-card p-4 text-center">
                <p className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Member Activity</h3>
            <div className="space-y-2">
              {activeMembers.map(m => {
                const logs = memberLogs[m.user_email] || [];
                const mins = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
                const books = [...new Set(logs.map(l => l.book_title).filter(Boolean))];
                return (
                  <div key={m.id} className="lx-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.user_email}</p>
                      <span className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>{mins}m</span>
                    </div>
                    <div className="flex gap-4 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <span>{logs.length} sessions</span>
                      <span>{books.length} books</span>
                    </div>
                    {books.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {books.slice(0, 3).map(b => (
                          <span key={b} className="text-xs px-1.5 py-0.5 rounded truncate max-w-[150px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{b}</span>
                        ))}
                        {books.length > 3 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{books.length - 3} more</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS */}
      {tab === 'members' && (
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="lx-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: m.kicked ? 'var(--bg-elevated)' : 'var(--lx-accent)', color: m.kicked ? 'var(--text-muted)' : 'var(--bg-primary)' }}>
                {(m.user_email?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: m.kicked ? 'var(--text-muted)' : 'var(--text-primary)' }}>{m.user_email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role}</span>
                  {m.kicked && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Removed</span>}
                  {m.dual_mode_enabled && <span className="text-xs px-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>Dual Mode</span>}
                </div>
              </div>
              {m.role !== 'admin' && (
                <div className="flex gap-1">
                  {m.kicked ? (
                    <button onClick={() => reinstateMemeber(m)} title="Reinstate" className="p-1.5 rounded transition-all" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                      <UserCheck size={14} />
                    </button>
                  ) : (
                    <button onClick={() => kickMember(m)} title="Remove from school" className="p-1.5 rounded transition-all" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <UserX size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>School Theme (Applied to all members)</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { key: 'theme_primary', label: 'Primary Color' },
                { key: 'theme_accent', label: 'Accent Color' },
                { key: 'theme_secondary', label: 'Background Tone' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={themeForm[key] || '#f5a623'}
                      onChange={e => setThemeForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0.5" style={{ background: 'var(--bg-elevated)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{themeForm[key] || '#f5a623'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Feature Restrictions</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Disabled features will be hidden from school members.</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_FEATURES.map(feat => {
                const on = restrictions.includes(feat);
                return (
                  <button key={feat} onClick={() => toggleRestriction(feat)}
                    className="flex items-center justify-between p-3 rounded-lg text-sm transition-all"
                    style={{ background: on ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)', border: `1px solid ${on ? 'rgba(248,113,113,0.4)' : 'var(--lx-border)'}`, color: on ? '#f87171' : 'var(--text-secondary)' }}>
                    <span>{FEATURE_LABELS[feat]}</span>
                    <span className="text-xs">{on ? 'Restricted' : 'Allowed'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={saveTheme} disabled={saving} className="lx-btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--lx-border)' }}>
            <button onClick={deleteSchool} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              <Trash2 size={14} /> Delete School (Returns all members to normal mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}