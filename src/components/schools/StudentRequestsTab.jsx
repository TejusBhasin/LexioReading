import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Shield, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StudentRequestsTab({ school, user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => { if (school?.id) load(); }, [school]);

  async function load() {
    setLoading(true);
    try {
      const all = await base44.entities.SchoolMember.filter({ school_id: school.id, kicked: false });
      setMembers(all.filter(m => m.pending_class_id || m.pending_role));
    } catch (e) {}
    setLoading(false);
  }

  async function approveClassChange(member) {
    setActioning(member.id);
    try {
      await base44.functions.invoke('manageClassEnrollment', {
        action: 'approve_class_change',
        school_id: school.id,
        member_id: member.id,
      });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (e) {}
    setActioning(null);
  }

  async function rejectClassChange(member) {
    setActioning(member.id);
    try {
      await base44.functions.invoke('manageClassEnrollment', {
        action: 'reject_class_change',
        school_id: school.id,
        member_id: member.id,
      });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (e) {}
    setActioning(null);
  }

  async function approveRole(member) {
    setActioning(member.id);
    try {
      await base44.entities.SchoolMember.update(member.id, {
        role: 'semi_admin',
        pending_role: '',
      });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (e) {}
    setActioning(null);
  }

  async function rejectRole(member) {
    setActioning(member.id);
    try {
      await base44.entities.SchoolMember.update(member.id, { pending_role: '' });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (e) {}
    setActioning(null);
  }

  if (loading) return <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const classChanges = members.filter(m => m.pending_class_id);
  const roleRequests = members.filter(m => m.pending_role);

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Class change and sub-admin role requests from your students.
      </p>

      {members.length === 0 && (
        <div className="text-center py-12">
          <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending requests.</p>
        </div>
      )}

      {classChanges.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--lx-accent)' }}>CLASS CHANGES ({classChanges.length})</p>
          <div className="space-y-3">
            {classChanges.map(m => (
              <div key={m.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.username || m.user_email}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <BookOpen size={11} /> Requesting: <span style={{ color: 'var(--lx-accent)' }}>{m.pending_class_name}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveClassChange(m)} disabled={actioning === m.id}
                    className="lx-btn-primary text-sm flex-1 justify-center">
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => rejectClassChange(m)} disabled={actioning === m.id}
                    className="lx-btn-ghost text-sm flex-1 justify-center" style={{ color: '#f87171' }}>
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {roleRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: '#818cf8' }}>SUB-ADMIN REQUESTS ({roleRequests.length})</p>
          <div className="space-y-3">
            {roleRequests.map(m => (
              <div key={m.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: '#818cf8' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.username || m.user_email}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Requesting sub-admin (teacher) access</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRole(m)} disabled={actioning === m.id}
                    className="lx-btn-primary text-sm flex-1 justify-center">
                    <Check size={13} /> Promote to Sub-Admin
                  </button>
                  <button onClick={() => rejectRole(m)} disabled={actioning === m.id}
                    className="lx-btn-ghost text-sm flex-1 justify-center" style={{ color: '#f87171' }}>
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}