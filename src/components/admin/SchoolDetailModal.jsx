import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, GraduationCap, Users, Shield, ScrollText, AlertTriangle, Eye, EyeOff, ArrowRight, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolDetailModal({ schoolId, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadDetails(); }, [schoolId]);

  async function loadDetails() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminSchoolView', { action: 'get_school_details', school_id: schoolId });
      setData(res.data);
    } catch (e) {}
    setLoading(false);
  }

  async function becomeAdmin() {
    setActionLoading(true);
    try {
      await base44.functions.invoke('adminSchoolView', { action: 'become_admin', school_id: schoolId });
      await loadDetails();
    } catch (e) {}
    setActionLoading(false);
  }

  async function leaveAdmin() {
    setActionLoading(true);
    try {
      await base44.functions.invoke('adminSchoolView', { action: 'leave_admin', school_id: schoolId });
      await loadDetails();
    } catch (e) {}
    setActionLoading(false);
  }

  const isHiddenAdmin = data?.hidden_admins?.some(a => true);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between px-4 h-14 border-b flex-shrink-0" style={{ borderColor: 'var(--lx-border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap size={18} style={{ color: 'var(--lx-accent)' }} />
          <span className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{data?.school?.name || 'School Details'}</span>
        </div>
        <button onClick={onClose} className="flex items-center justify-center rounded" style={{ minWidth: 44, minHeight: 44, color: 'var(--text-secondary)' }}>
          <X size={22} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--lx-accent)' }} />
        </div>
      ) : data ? (
        <>
          {/* Tabs */}
          <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto" style={{ borderColor: 'var(--lx-border)' }}>
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'logs', label: 'Action Logs', icon: ScrollText },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap flex-shrink-0"
                style={{ background: tab === t.id ? 'var(--lx-accent)' : 'transparent', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="lx-card p-5">
                  <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>School Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Name</span><span style={{ color: 'var(--text-primary)' }}>{data.school.name}</span></div>
                    {data.school.description && <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Description</span><span style={{ color: 'var(--text-primary)' }}>{data.school.description}</span></div>}
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Creator</span><span style={{ color: 'var(--text-primary)' }}>{data.school.creator_email}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Join Code</span><span className="font-mono" style={{ color: 'var(--lx-accent)' }}>{data.school.join_code}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Members</span><span style={{ color: 'var(--text-primary)' }}>{data.members.length}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Content Isolation</span><span style={{ color: data.school.content_isolation ? '#10b981' : 'var(--text-muted)' }}>{data.school.content_isolation ? 'Enabled' : 'Disabled'}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Age Restriction</span><span style={{ color: 'var(--text-primary)' }}>{data.school.age_restriction || 'all'}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Created</span><span style={{ color: 'var(--text-primary)' }}>{new Date(data.school.created_date).toLocaleDateString()}</span></div>
                  </div>
                </div>

                {/* Hidden admin status */}
                <div className="lx-card p-5">
                  <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Admin Access</h3>
                  {data.hidden_admins.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: '#10b981' }}>
                        <EyeOff size={14} className="inline mr-1" />
                        You are a hidden admin of this school. You can access the admin panel without appearing in member lists.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/school-admin')} className="lx-btn-primary text-sm flex-1 justify-center">
                          <ArrowRight size={14} /> Go to Admin Panel
                        </button>
                        <button onClick={leaveAdmin} disabled={actionLoading} className="lx-btn-ghost text-sm">
                          {actionLoading ? '...' : 'Leave Admin'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Become a hidden admin to access the school's admin panel. You won't appear as a member or admin to other school admins or members.
                      </p>
                      <button onClick={becomeAdmin} disabled={actionLoading} className="lx-btn-primary text-sm w-full justify-center">
                        {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <><Eye size={14} /> Become Hidden Admin</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Member preview */}
                <div className="lx-card p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Users size={16} style={{ color: 'var(--lx-accent)' }} /> Members ({data.members.length})
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {data.members.slice(0, 20).map(m => (
                      <div key={m.id} className="flex items-center justify-between text-sm py-1">
                        <span style={{ color: 'var(--text-primary)' }}>{m.username || m.user_email}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: m.role === 'admin' ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: m.role === 'admin' ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                    {data.members.length > 20 && <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>+{data.members.length - 20} more</p>}
                  </div>
                </div>
              </div>
            )}

            {tab === 'logs' && (
              <div className="space-y-2">
                {data.logs.length === 0 ? (
                  <div className="text-center py-12">
                    <ScrollText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No action logs yet.</p>
                  </div>
                ) : (
                  data.logs.map(log => (
                    <div key={log.id} className="lx-card p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: log.actor_role === 'lexio_admin' ? 'rgba(245,166,35,0.15)' : 'var(--bg-elevated)', color: log.actor_role === 'lexio_admin' ? 'var(--lx-accent)' : 'var(--text-secondary)' }}>
                          {log.actor_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{log.action_description || log.action_type}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {log.actor_name} · {log.actor_role === 'lexio_admin' ? 'Lexio Admin' : log.actor_role}
                            {log.target_email && ` · Target: ${log.target_email}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={10} className="inline mr-1" />{new Date(log.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'incidents' && (
              <div className="space-y-2">
                {data.incidents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No incidents reported.</p>
                  </div>
                ) : (
                  data.incidents.map(inc => (
                    <div key={inc.id} className="lx-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: inc.status === 'pending' ? 'rgba(249,115,22,0.15)' : inc.status === 'actioned' ? 'rgba(248,113,113,0.15)' : 'var(--bg-elevated)', color: inc.status === 'pending' ? '#f97316' : inc.status === 'actioned' ? '#f87171' : 'var(--text-muted)' }}>
                          {inc.status}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{inc.content_type}</span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{inc.content_snapshot?.slice(0, 150) || 'No content'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Reported: {inc.reported_user_email} · Reason: {inc.reason}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(inc.created_date).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: 'var(--text-muted)' }}>Failed to load school details.</p>
        </div>
      )}
    </div>
  );
}