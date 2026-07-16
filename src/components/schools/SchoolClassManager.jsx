import React, { useState, useEffect } from 'react';
import { BookOpen, Send, Clock, Shield, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolClassManager({ user }) {
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const memberships = await base44.entities.SchoolMember.filter({ user_email: user.email, kicked: false });
      const activeMember = memberships.find(m => !m.dual_mode_enabled || m.currently_school_mode) || memberships[0];
      if (!activeMember) { setLoading(false); return; }
      setMember(activeMember);
      const allClasses = await base44.entities.SchoolClass.filter({ school_id: activeMember.school_id });
      setClasses(allClasses);
    } catch (e) {}
    setLoading(false);
  }

  const currentClass = classes.find(c => c.student_emails?.includes(user.email));

  async function requestClassChange() {
    if (!selectedClass || !member) return;
    setSubmitting(true);
    try {
      await base44.entities.SchoolMember.update(member.id, {
        pending_class_id: selectedClass.id,
        pending_class_name: selectedClass.class_name,
      });
      setMember({ ...member, pending_class_id: selectedClass.id, pending_class_name: selectedClass.class_name });
      setShowClassSelect(false);
      setSelectedClass(null);
    } catch (e) {}
    setSubmitting(false);
  }

  async function requestTeacherRole() {
    if (!member) return;
    setSubmitting(true);
    try {
      await base44.entities.SchoolMember.update(member.id, { pending_role: 'semi_admin' });
      setMember({ ...member, pending_role: 'semi_admin' });
    } catch (e) {}
    setSubmitting(false);
  }

  if (loading || !member) return null;

  const isMember = member.role === 'member';

  return (
    <div className="space-y-3">
      {currentClass && (
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <BookOpen size={16} style={{ color: 'var(--lx-accent)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your Class</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{currentClass.class_name}</p>
            {currentClass.subject && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentClass.subject}</p>}
          </div>
        </div>
      )}

      {member.pending_class_id && (
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <Clock size={16} style={{ color: '#f97316' }} />
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: '#f97316' }}>Class Change Pending</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Requesting: {member.pending_class_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for admin approval</p>
          </div>
        </div>
      )}

      {!member.pending_class_id && (
        <button onClick={() => setShowClassSelect(!showClassSelect)} className="lx-btn-ghost w-full justify-center text-sm">
          <ChevronRight size={14} /> {currentClass ? 'Change Class' : 'Select Class'}
        </button>
      )}

      {showClassSelect && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Select a new class</p>
          {classes.length === 0 && <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No classes available in your school yet.</p>}
          {classes.map(cls => {
            const isCurrent = cls.student_emails?.includes(user.email);
            const isSelected = selectedClass?.id === cls.id;
            return (
              <button key={cls.id} onClick={() => setSelectedClass(cls)} disabled={isCurrent}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all"
                style={{
                  background: isSelected ? 'var(--lx-accent)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  opacity: isCurrent ? 0.5 : 1,
                }}>
                <span>{cls.class_name}</span>
                {isCurrent && <span className="text-xs">Current</span>}
              </button>
            );
          })}
          {classes.length > 0 && (
            <button onClick={requestClassChange} disabled={!selectedClass || submitting}
              className="lx-btn-primary w-full justify-center text-sm">
              <Send size={13} /> {submitting ? 'Submitting...' : 'Request Class Change'}
            </button>
          )}
        </div>
      )}

      {isMember && !member.pending_role && (
        <button onClick={requestTeacherRole} disabled={submitting}
          className="lx-btn-ghost w-full justify-center text-sm"
          style={{ borderColor: 'var(--lx-accent)', color: 'var(--lx-accent)' }}>
          <Shield size={14} /> I'm a Teacher — Request Sub-Admin Access
        </button>
      )}
      {member.pending_role === 'semi_admin' && (
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Clock size={16} style={{ color: '#818cf8' }} />
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: '#818cf8' }}>Sub-Admin Request Pending</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for admin approval</p>
          </div>
        </div>
      )}
    </div>
  );
}