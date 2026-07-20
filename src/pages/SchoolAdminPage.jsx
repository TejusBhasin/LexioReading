import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Users, Settings, BarChart2, Trash2, UserX, UserCheck, RefreshCw, ShieldAlert, ChevronDown, ChevronUp, Shield, Crown, Lock, Send, BookOpen, Sparkles, Bot, Mail, Check, X, Clock, Ban, Archive, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ClassesTab from '@/components/schools/ClassesTab';
import SchoolAIChat from '@/components/schools/SchoolAIChat';
import SchoolSafetyTab from '@/components/schools/SchoolSafetyTab';
import StudentOverviewModal from '@/components/schools/StudentOverviewModal';
import StudentRequestsTab from '@/components/schools/StudentRequestsTab';
import SchoolContactTab from '@/components/schools/SchoolContactTab';
import BanStudentModal from '@/components/schools/BanStudentModal';
import SchoolSecurityDashboard from '@/components/schools/SchoolSecurityDashboard';
import OffboardStudentModal from '@/components/schools/OffboardStudentModal';
import SchoolNotifyModal from '@/components/schools/SchoolNotifyModal';
import AdminAccessGate from '@/components/admin/AdminAccessGate';

const FEATURE_LABELS = {
  vault: 'Vault',
  forums: 'Forums',
  clubs: 'Clubs',
  chat: 'AI Chat',
  reviews: 'Reviews',
  wrapped: 'Wrapped',
  discover: 'Discover',
  book_creator: 'Book Creator',
};
const ALL_FEATURES = Object.keys(FEATURE_LABELS);

const SEMI_ADMIN_PERMISSIONS = [
  { key: 'view_members', label: 'View Member List' },
  { key: 'view_member_data', label: 'View Student Reading Data' },
  { key: 'restrict_individual', label: 'Restrict Individual Students' },
  { key: 'kick_members', label: 'Remove Students' },
  { key: 'manage_restrictions', label: 'Manage School-Wide Restrictions' },
  { key: 'manage_theme', label: 'Manage School Theme' },
];

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
  const [requireSetupTour, setRequireSetupTour] = useState(false);
  const [ageRestriction, setAgeRestriction] = useState('all');
  const [applyingAge, setApplyingAge] = useState(false);
  const [ageApplied, setAgeApplied] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [isolationRequest, setIsolationRequest] = useState(null);
  const [isolationReason, setIsolationReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [emailDomainInput, setEmailDomainInput] = useState('');
  const [submittingDomain, setSubmittingDomain] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  const [offboardTarget, setOffboardTarget] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyAll, setNotifyAll] = useState(false);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      // Find school where user is admin or semi_admin
      const myMemberships = await base44.entities.SchoolMember.filter({ user_email: user.email, kicked: false });
      const schoolMember = myMemberships.find(m => m.role === 'admin' || m.role === 'semi_admin');

      // If not admin/semi_admin, check if they're a teacher
      if (!schoolMember) {
        try {
          const teacherClasses = await base44.entities.SchoolClass.filter({ teacher_email: user.email });
          if (teacherClasses.length > 0) setUserRole('teacher');
        } catch (e) {}
        setLoading(false);
        return;
      }

      const schools = await base44.entities.School.filter({ id: schoolMember.school_id });
      if (!schools[0]) { setLoading(false); return; }
      const s = schools[0];
      setSchool(s);
      setUserRole(schoolMember.role);
      setTab(schoolMember.role === 'semi_admin' ? 'classes' : 'overview');
      setThemeForm({ theme_primary: s.theme_primary, theme_accent: s.theme_accent, theme_secondary: s.theme_secondary });
      setRestrictions(s.restrictions || []);
      setRequireSetupTour(s.require_setup_tour || false);
      setAgeRestriction(s.age_restriction || 'all');

      // Load any existing content isolation request
      const reqs = await base44.entities.SchoolChangeRequest.filter({ school_id: s.id });
      setIsolationRequest(reqs.find(r => r.status === 'pending') || reqs[0] || null);

      // Only load all members and logs if admin (semi_admins can't read all members via RLS)
      if (schoolMember.role === 'admin') {
        const mems = (await base44.entities.SchoolMember.filter({ school_id: s.id })).filter(m => !m.hidden);
        setMembers(mems);

        // Fetch reading logs for all members
        const logs = {};
        await Promise.all(mems.map(async m => {
          const l = await base44.entities.ReadingLog.filter({ user_email: m.user_email });
          logs[m.user_email] = l;
        }));
        setMemberLogs(logs);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function saveTheme() {
    if (!school) return;
    setSaving(true);
    await base44.entities.School.update(school.id, { ...themeForm, restrictions, require_setup_tour: requireSetupTour, age_restriction: ageRestriction });
    setSchool(s => ({ ...s, ...themeForm, restrictions, age_restriction: ageRestriction }));
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

  async function applyAgeRestriction() {
    if (!school || !members.length) return;
    if (!confirm(`Apply "${ageRestriction}" age filter to all ${members.filter(m => !m.kicked).length} active members? This will override their individual age settings.`)) return;
    setApplyingAge(true);
    try {
      const active = members.filter(m => !m.kicked);
      await Promise.all(active.map(async m => {
        const profiles = await base44.entities.UserProfile.filter({ user_email: m.user_email });
        if (profiles[0]) {
          await base44.entities.UserProfile.update(profiles[0].id, { age_filter: ageRestriction });
        } else {
          await base44.entities.UserProfile.create({ user_email: m.user_email, age_filter: ageRestriction });
        }
      }));
      setAgeApplied(true);
      setTimeout(() => setAgeApplied(false), 3000);
    } catch (e) {}
    setApplyingAge(false);
  }

  async function submitIsolationRequest() {
    if (!school) return;
    setSubmittingRequest(true);
    try {
      const req = await base44.entities.SchoolChangeRequest.create({
        school_id: school.id,
        school_name: school.name,
        admin_email: user.email,
        request_type: 'content_isolation',
        reason: isolationReason.trim(),
        status: 'pending',
      });
      setIsolationRequest(req);
      setIsolationReason('');
    } catch (e) {}
    setSubmittingRequest(false);
  }

  async function submitEmailDomain() {
    if (!emailDomainInput.trim() || !school) return;
    const domain = emailDomainInput.trim().toLowerCase().replace(/^@/, '');
    setSubmittingDomain(true);
    try {
      await base44.entities.SchoolChangeRequest.create({
        school_id: school.id,
        school_name: school.name,
        admin_email: user.email,
        request_type: 'email_domain',
        requested_email_domain: domain,
        reason: `Requesting email domain @${domain} for auto-join`,
        status: 'pending',
      });
      await base44.entities.School.update(school.id, { email_domain: domain, email_domain_status: 'pending' });
      setSchool(s => ({ ...s, email_domain: domain, email_domain_status: 'pending' }));
      setEmailDomainInput('');
    } catch (e) {}
    setSubmittingDomain(false);
  }

  async function deleteSchool() {
    if (!confirm('Delete this school? All members will return to normal mode. This cannot be undone.')) return;
    // Mark all members as kicked (returns them to normal)
    await Promise.all(members.map(m => base44.entities.SchoolMember.update(m.id, { kicked: true })));
    await base44.entities.School.update(school.id, { is_active: false });
    navigate('/profile');
  }

  async function promoteToSemiAdmin(member) {
    await base44.entities.SchoolMember.update(member.id, { role: 'semi_admin' });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: 'semi_admin' } : m));
  }

  async function demoteToMember(member) {
    await base44.entities.SchoolMember.update(member.id, { role: 'member', permissions: [] });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: 'member', permissions: [] } : m));
  }

  async function togglePermission(member, perm) {
    const current = member.permissions || [];
    const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
    await base44.entities.SchoolMember.update(member.id, { permissions: updated });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, permissions: updated } : m));
  }

  async function toggleIndividualRestriction(member, feat) {
    const current = member.individual_restrictions || [];
    const updated = current.includes(feat) ? current.filter(f => f !== feat) : [...current, feat];
    await base44.entities.SchoolMember.update(member.id, { individual_restrictions: updated });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, individual_restrictions: updated } : m));
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
      {userRole === 'teacher' ? (
        <>
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're a Teacher</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>You have classes assigned to you. View your class statistics below.</p>
          <button onClick={() => navigate('/my-classes')} className="lx-btn-primary">View My Classes →</button>
        </>
      ) : (
        <>
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No School Found</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>You don't manage any school yet.</p>
          <button onClick={() => navigate('/profile')} className="lx-btn-ghost">← Back to Profile</button>
        </>
      )}
    </div>
  );

  const activeMembers = members.filter(m => !m.kicked);
  const totalLogs = Object.values(memberLogs).flat().length;
  const totalMinutes = Object.values(memberLogs).flat().reduce((s, l) => s + (l.time_spent_minutes || 0), 0);

  return (
    <AdminAccessGate label="School Admin Panel">
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
          ...(userRole === 'admin' ? [{ id: 'overview', label: 'Overview', icon: BarChart2 }] : []),
          ...(userRole === 'admin' ? [{ id: 'members', label: 'Members', icon: Users }] : []),
          ...(userRole === 'admin' ? [{ id: 'requests', label: 'Requests', icon: Clock }] : []),
          ...(userRole === 'admin' ? [{ id: 'contact', label: 'Contact', icon: Mail }] : []),
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'classes', label: 'Classes', icon: BookOpen },
          { id: 'safety', label: 'Safety', icon: ShieldAlert },
          { id: 'ai', label: 'AI Assistant', icon: Bot },
          ...(userRole === 'admin' ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* REQUESTS */}
      {tab === 'requests' && (
        <StudentRequestsTab school={school} user={user} />
      )}

      {/* CONTACT */}
      {tab === 'contact' && (
        <SchoolContactTab school={school} user={user} />
      )}

      {/* SECURITY */}
      {tab === 'security' && (
        <SchoolSecurityDashboard school={school} user={user} members={members} onRefresh={load} />
      )}

      {/* CLASSES */}
      {tab === 'classes' && (
        <ClassesTab school={school} user={user} />
      )}

      {/* SAFETY */}
      {tab === 'safety' && (
        <SchoolSafetyTab school={school} user={user} />
      )}

      {/* AI ASSISTANT */}
      {tab === 'ai' && (
        <div>
          <div className="mb-5 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--lx-accent)' }}>
            <Bot size={18} style={{ color: 'var(--lx-accent)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--lx-accent)' }}>School-Wide AI Analytics</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ask questions about all your students' reading data, or get an AI-generated overview.</p>
            </div>
          </div>
          <SchoolAIChat schoolId={school.id} classId={null} scopeLabel={school.name} />
        </div>
      )}

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
                  <div key={m.id} className="lx-card p-3" style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(m)}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.username || m.user_email} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→ View Details</span></p>
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
        <div className="space-y-2">
          {members.map(m => {
            const isExpanded = expandedMember === m.id;
            const isSemiAdmin = m.role === 'semi_admin';
            const memberPerms = m.permissions || [];
            const indivRestrictions = m.individual_restrictions || [];
            return (
              <div key={m.id} className="lx-card overflow-hidden">
                <div className="p-4 flex items-center gap-3" style={{ cursor: m.role !== 'admin' && !m.kicked ? 'pointer' : 'default' }} onClick={() => m.role !== 'admin' && !m.kicked && setExpandedMember(isExpanded ? null : m.id)}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: m.kicked ? 'var(--bg-elevated)' : isSemiAdmin ? '#818cf8' : 'var(--bg-elevated)', color: m.kicked ? 'var(--text-muted)' : isSemiAdmin ? '#fff' : 'var(--lx-accent)', border: isSemiAdmin || m.kicked ? 'none' : '1px solid var(--lx-border)' }}>
                    {m.role === 'admin' ? <Crown size={14} /> : (m.user_email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: m.kicked ? 'var(--text-muted)' : 'var(--text-primary)' }}>{m.user_email}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: m.role === 'admin' ? 'rgba(245,166,35,0.15)' : isSemiAdmin ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)', color: m.role === 'admin' ? 'var(--lx-accent)' : isSemiAdmin ? '#818cf8' : 'var(--text-muted)' }}>
                        {m.role === 'admin' ? 'Admin' : isSemiAdmin ? 'Semi-Admin' : 'Member'}
                      </span>
                      {m.kicked && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Removed</span>}
                      {indivRestrictions.length > 0 && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{indivRestrictions.length} restricted</span>}
                      {m.dual_mode_enabled && <span className="text-xs px-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>Dual Mode</span>}
                    </div>
                  </div>
                  {m.role !== 'admin' && (
                    <div className="flex items-center gap-1">
                      {m.kicked ? (
                        <button onClick={(e) => { e.stopPropagation(); reinstateMemeber(m); }} title="Reinstate" className="p-1.5 rounded transition-all" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                          <UserCheck size={14} />
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); kickMember(m); }} title="Remove from school" className="p-1.5 rounded transition-all" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                          <UserX size={14} />
                        </button>
                      )}
                      {!m.kicked && (isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />)}
                    </div>
                  )}
                </div>

                {isExpanded && !m.kicked && m.role !== 'admin' && (
                  <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                    <div className="pt-3">
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Role</p>
                      <div className="flex gap-2">
                        <button onClick={() => demoteToMember(m)} disabled={m.role === 'member'}
                          className="flex-1 py-2 rounded text-xs font-medium transition-all"
                          style={{ background: m.role === 'member' ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: m.role === 'member' ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${m.role === 'member' ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                          Member
                        </button>
                        <button onClick={() => promoteToSemiAdmin(m)} disabled={isSemiAdmin}
                          className="flex-1 py-2 rounded text-xs font-medium transition-all"
                          style={{ background: isSemiAdmin ? '#818cf8' : 'var(--bg-elevated)', color: isSemiAdmin ? '#fff' : 'var(--text-secondary)', border: `1px solid ${isSemiAdmin ? '#818cf8' : 'var(--lx-border)'}` }}>
                          <Shield size={11} className="inline mr-1" /> Semi-Admin
                        </button>
                      </div>
                    </div>

                    {isSemiAdmin && (
                      <div>
                        <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Shield size={11} /> Semi-Admin Permissions</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Choose what this semi-admin can do.</p>
                        <div className="space-y-1.5">
                          {SEMI_ADMIN_PERMISSIONS.map(perm => {
                            const has = memberPerms.includes(perm.key);
                            return (
                              <div key={perm.key} className="flex items-center justify-between px-3 py-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{perm.label}</span>
                                <button onClick={() => togglePermission(m, perm.key)} className="w-9 h-5 rounded-full transition-all relative flex-shrink-0" style={{ background: has ? '#818cf8' : 'var(--lx-border)' }}>
                                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: has ? '20px' : '2px' }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Individual Restrictions</p>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Restrict specific features for this student only (in addition to school-wide restrictions).</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {ALL_FEATURES.map(feat => {
                          const restricted = indivRestrictions.includes(feat);
                          return (
                            <button key={feat} onClick={() => toggleIndividualRestriction(m, feat)}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all"
                              style={{ background: restricted ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)', border: `1px solid ${restricted ? 'rgba(248,113,113,0.4)' : 'var(--lx-border)'}`, color: restricted ? '#f87171' : 'var(--text-secondary)' }}>
                              <span>{FEATURE_LABELS[feat]}</span>
                              <span className="text-[10px]">{restricted ? 'Blocked' : 'Allowed'}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Actions: Notify, Ban, Offboard */}
                      <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--lx-border)' }}>
                        <button
                          onClick={() => setNotifyTarget({ email: m.user_email, name: m.username })}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
                          style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--lx-accent)', border: '1px solid rgba(245,166,35,0.3)' }}
                        >
                          <Bell size={12} /> Send Notification
                        </button>
                        <button
                          onClick={() => setBanTarget({ email: m.user_email, name: m.username })}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
                          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                        >
                          <Ban size={12} /> Ban Student (up to 7 days)
                        </button>
                        <button
                          onClick={() => setOffboardTarget({ email: m.user_email, name: m.username })}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}
                        >
                          <Archive size={12} /> Offboard Student (archive & remove)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

          {/* Age Restriction */}
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ShieldAlert size={16} style={{ color: 'var(--lx-accent)' }} /> Age Restriction
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Mass-apply an age filter to all school members. They will only see books appropriate for the selected level.</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { value: 'all', label: 'All Ages', desc: 'No restriction' },
                { value: 'teen', label: 'Teen', desc: 'Teen-appropriate only' },
                { value: 'adult', label: 'Adult', desc: 'Adult content visible' },
              ].map(opt => {
                const on = ageRestriction === opt.value;
                return (
                  <button key={opt.value} onClick={() => setAgeRestriction(opt.value)}
                    className="p-3 rounded-lg text-center transition-all"
                    style={{ background: on ? 'var(--lx-accent)' : 'var(--bg-elevated)', border: `1px solid ${on ? 'var(--lx-accent)' : 'var(--lx-border)'}`, color: on ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <button onClick={applyAgeRestriction} disabled={applyingAge || ageRestriction === 'all'}
              className="lx-btn-ghost text-sm w-full justify-center"
              style={ageRestriction === 'all' ? { opacity: 0.5 } : {}}>
              {applyingAge ? 'Applying to all members...' : ageApplied ? '✓ Applied to all members!' : `Apply "${ageRestriction}" to all members now`}
            </button>
          </div>

          {/* Require Setup Tour */}
          <div>
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Setup Tour</h3>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Require setup tour for members</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Members who skipped the setup tour will be forced to complete it when they next open the app.</p>
              </div>
              <button
                onClick={() => setRequireSetupTour(v => !v)}
                className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative ml-4"
                style={{ background: requireSetupTour ? 'var(--lx-accent)' : 'var(--border-strong)' }}
              >
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: requireSetupTour ? '22px' : '2px' }} />
              </button>
            </div>
          </div>

          {/* Content Isolation */}
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Lock size={16} style={{ color: 'var(--lx-accent)' }} /> Content Isolation
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              When enabled, your students will only see reviews, forum posts, and clubs created by other members of this school — the rest of Lexio's community content is hidden from them.
            </p>

            {school.content_isolation ? (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="flex items-center gap-2">
                  <Lock size={14} style={{ color: '#10b981' }} />
                  <span className="text-sm font-bold" style={{ color: '#10b981' }}>Isolation Active</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Students only see content from school members. Contact Lexio support to disable.</p>
              </div>
            ) : isolationRequest?.status === 'pending' ? (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={14} style={{ color: '#f97316' }} />
                  <span className="text-sm font-bold" style={{ color: '#f97316' }}>Request Pending Review</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Submitted on {new Date(isolationRequest.created_date).toLocaleDateString()}. Lexio admins will review your request.</p>
              </div>
            ) : isolationRequest?.status === 'rejected' ? (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={14} style={{ color: '#f87171' }} />
                  <span className="text-sm font-bold" style={{ color: '#f87171' }}>Request Rejected</span>
                </div>
                {isolationRequest.admin_notes && <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{isolationRequest.admin_notes}</p>}
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>You can submit a new request below.</p>
                <textarea className="lx-input text-sm resize-none mb-2" rows={3}
                  placeholder="Why does your school need content isolation?"
                  value={isolationReason} onChange={e => setIsolationReason(e.target.value)} />
                <button onClick={submitIsolationRequest} disabled={submittingRequest || !isolationReason.trim()}
                  className="lx-btn-primary text-sm w-full justify-center">
                  <Send size={13} /> {submittingRequest ? 'Submitting...' : 'Submit New Request'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Content isolation requires approval from Lexio admins. Submit a request explaining why your school needs this.
                </p>
                <textarea className="lx-input text-sm resize-none" rows={3}
                  placeholder="Why does your school need content isolation?"
                  value={isolationReason} onChange={e => setIsolationReason(e.target.value)} />
                <button onClick={submitIsolationRequest} disabled={submittingRequest || !isolationReason.trim()}
                  className="lx-btn-primary text-sm w-full justify-center">
                  <Send size={13} /> {submittingRequest ? 'Submitting...' : 'Submit Database View Change Request'}
                </button>
              </div>
            )}
          </div>

          {/* Email Domain */}
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Mail size={16} style={{ color: 'var(--lx-accent)' }} /> Custom Email Domain
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              If your school uses a custom email domain (e.g. @school.org), submit it for approval. Once approved, anyone who signs up with that domain will automatically join your school.
            </p>
            {school.email_domain_status === 'approved' ? (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="flex items-center gap-2">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span className="text-sm font-bold" style={{ color: '#10b981' }}>Domain Approved</span>
                </div>
                <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-secondary)' }}>@{school.email_domain}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Users signing up with this domain will auto-join your school.</p>
              </div>
            ) : school.email_domain_status === 'pending' ? (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} style={{ color: '#f97316' }} />
                  <span className="text-sm font-bold" style={{ color: '#f97316' }}>Pending Review</span>
                </div>
                <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>@{school.email_domain}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Lexio admins will review your request.</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                {school.email_domain_status === 'rejected' && (
                  <p className="text-xs" style={{ color: '#f87171' }}>Previous request was rejected. You can submit a new one.</p>
                )}
                <div className="flex gap-2">
                  <input className="lx-input text-sm flex-1" placeholder="e.g. school.org"
                    value={emailDomainInput} onChange={e => setEmailDomainInput(e.target.value)} />
                  <button onClick={submitEmailDomain} disabled={submittingDomain || !emailDomainInput.trim()}
                    className="lx-btn-primary text-sm whitespace-nowrap">
                    <Send size={13} /> {submittingDomain ? '...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
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

      {selectedStudent && (
        <StudentOverviewModal
          schoolId={school.id}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {banTarget && (
        <BanStudentModal
          studentEmail={banTarget.email}
          studentName={banTarget.name}
          onClose={() => setBanTarget(null)}
          onBanned={() => setBanTarget(null)}
        />
      )}

      {offboardTarget && (
        <OffboardStudentModal
          studentEmail={offboardTarget.email}
          studentName={offboardTarget.name}
          schoolId={school.id}
          onClose={() => setOffboardTarget(null)}
          onDone={() => { setOffboardTarget(null); load(); }}
        />
      )}

      {notifyAll && (
        <SchoolNotifyModal
          schoolId={school.id}
          schoolName={school.name}
          onClose={() => setNotifyAll(false)}
          onSent={() => setNotifyAll(false)}
        />
      )}

      {notifyTarget && (
        <SchoolNotifyModal
          schoolId={school.id}
          schoolName={school.name}
          targetEmail={notifyTarget.email}
          targetName={notifyTarget.name}
          onClose={() => setNotifyTarget(null)}
          onSent={() => setNotifyTarget(null)}
        />
      )}
    </div>
    </AdminAccessGate>
  );
}