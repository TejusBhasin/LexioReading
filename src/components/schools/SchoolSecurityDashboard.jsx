import React, { useState, useEffect } from 'react';
import { Shield, Users, Ban, Send, AlertTriangle, Clock, ArrowRight, Archive, Download, Bot, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import BanStudentModal from '@/components/schools/BanStudentModal';
import OffboardStudentModal from '@/components/schools/OffboardStudentModal';
import SchoolNotifyModal from '@/components/schools/SchoolNotifyModal';
import BulkDeleteModal from '@/components/schools/BulkDeleteModal';

export default function SchoolSecurityDashboard({ school, user, members, onRefresh }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [banTarget, setBanTarget] = useState(null);
  const [offboardTarget, setOffboardTarget] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyAll, setNotifyAll] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [aiSorting, setAiSorting] = useState(false);
  const [sortedIncidents, setSortedIncidents] = useState(null);

  useEffect(() => { if (school?.id) loadIncidents(); }, [school]);

  async function loadIncidents() {
    setLoadingIncidents(true);
    try {
      const res = await base44.functions.invoke('schoolSafetyIncidents', {
        action: 'list',
        school_id: school.id,
      });
      setIncidents(res.data?.incidents || []);
    } catch (e) {}
    setLoadingIncidents(false);
  }

  async function aiSortIncidents() {
    if (incidents.length === 0) return;
    setAiSorting(true);
    try {
      const incidentSummaries = incidents.map((inc, i) => ({
        id: inc.id,
        type: inc.content_type,
        reason: inc.reason,
        status: inc.status,
        content: (inc.content_snapshot || '').slice(0, 200),
        student: inc.reported_username,
      }));

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a school safety assistant. Sort these reported incidents by severity (most severe first). Consider: type of violation, repeat offenders, and content severity. Return a JSON array of incident IDs in priority order.

Incidents:
${JSON.stringify(incidentSummaries, null, 2)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            sorted_ids: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' },
          }
        }
      });

      if (res?.sorted_ids) {
        const sorted = res.sorted_ids
          .map(id => incidents.find(i => i.id === id))
          .filter(Boolean);
        setSortedIncidents({ items: sorted, reasoning: res.reasoning });
      }
    } catch (e) {}
    setAiSorting(false);
  }

  const activeMembers = members.filter(m => !m.kicked);
  const kickedMembers = members.filter(m => m.kicked && !m.archived);
  const archivedMembers = members.filter(m => m.archived);
  const pendingIncidents = incidents.filter(i => i.status === 'pending');

  const displayIncidents = sortedIncidents?.items || incidents.filter(i => i.status === 'pending');

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Members', value: activeMembers.length, icon: Users, color: 'var(--lx-accent)' },
          { label: 'Pending Incidents', value: pendingIncidents.length, icon: AlertTriangle, color: pendingIncidents.length > 0 ? '#f97316' : 'var(--text-muted)' },
          { label: 'Removed', value: kickedMembers.length, icon: Ban, color: '#f87171' },
          { label: 'Archived', value: archivedMembers.length, icon: Archive, color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="lx-card p-4 text-center">
            <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
            <p className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button onClick={() => setNotifyAll(true)}
          className="lx-card p-4 flex items-center gap-3 text-left transition-all hover:border-accent">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
            <Send size={18} style={{ color: 'var(--lx-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notify School</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send a message to all members</p>
          </div>
        </button>

        <button onClick={() => navigate('/school-admin')}
          className="lx-card p-4 flex items-center gap-3 text-left transition-all hover:border-accent">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Users size={18} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Manage Members</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Restrict, ban, or offboard students</p>
          </div>
        </button>

        <button onClick={() => navigate('/school-admin')}
          className="lx-card p-4 flex items-center gap-3 text-left transition-all hover:border-accent">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.15)' }}>
            <Shield size={18} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Safety Settings</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Restrictions, age filters, isolation</p>
          </div>
        </button>

        <button onClick={() => setShowBulkDelete(true)}
          className="lx-card p-4 flex items-center gap-3 text-left transition-all hover:border-accent"
          style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.15)' }}>
            <Trash2 size={18} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#f87171' }}>Bulk Delete</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Delete accounts by email list</p>
          </div>
        </button>
      </div>

      {/* Incidents with AI sorting */}
      <div className="lx-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: pendingIncidents.length > 0 ? '#f97316' : 'var(--text-muted)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Safety Incidents</h3>
            {pendingIncidents.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                {pendingIncidents.length} pending
              </span>
            )}
          </div>
          {pendingIncidents.length > 1 && (
            <button onClick={aiSortIncidents} disabled={aiSorting}
              className="lx-btn-ghost text-xs flex items-center gap-1.5">
              <Bot size={12} className={aiSorting ? 'animate-spin' : ''} />
              {aiSorting ? 'Sorting...' : 'Sort by Priority (AI)'}
            </button>
          )}
        </div>

        {sortedIncidents?.reasoning && (
          <div className="mb-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--lx-border)' }}>
            <Bot size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sortedIncidents.reasoning}</p>
          </div>
        )}

        {loadingIncidents ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : displayIncidents.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No pending incidents. Your school is safe. ✅</p>
        ) : (
          <div className="space-y-2">
            {displayIncidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--bg-card)', color: 'var(--lx-accent)' }}>
                      {inc.content_type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{inc.reason}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {inc.reported_username} · {inc.content_snapshot?.slice(0, 80) || 'No content'}
                  </p>
                </div>
                <button onClick={() => setBanTarget({ email: inc.reported_user_email, name: inc.reported_username, incidentId: inc.id })}
                  className="text-xs px-2.5 py-1.5 rounded font-medium flex-shrink-0 transition-all"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                  <Ban size={11} className="inline mr-1" /> Ban
                </button>
              </div>
            ))}
            {displayIncidents.length > 5 && (
              <button onClick={() => navigate('/school-admin')} className="w-full text-xs py-2 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                View all {displayIncidents.length} incidents <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Archived / Offboarded students */}
      {archivedMembers.length > 0 && (
        <div className="lx-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Archive size={14} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Offboarded Students</h3>
          </div>
          <div className="space-y-1.5">
            {archivedMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{m.username || m.user_email}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {m.archived_at ? `Offboarded ${new Date(m.archived_at).toLocaleDateString()}` : ''} · {m.archive_reason || 'No reason'}
                  </p>
                </div>
                <button onClick={() => setNotifyTarget({ email: m.user_email, name: m.username })}
                  className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <Send size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {banTarget && (
        <BanStudentModal
          studentEmail={banTarget.email}
          studentName={banTarget.name}
          incidentId={banTarget.incidentId}
          onClose={() => setBanTarget(null)}
          onBanned={() => { setBanTarget(null); loadIncidents(); onRefresh?.(); }}
        />
      )}

      {offboardTarget && (
        <OffboardStudentModal
          studentEmail={offboardTarget.email}
          studentName={offboardTarget.name}
          schoolId={school.id}
          onClose={() => setOffboardTarget(null)}
          onDone={() => { setOffboardTarget(null); onRefresh?.(); }}
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

      {showBulkDelete && (
        <BulkDeleteModal
          schoolId={school.id}
          schoolName={school.name}
          onClose={() => setShowBulkDelete(false)}
          onDone={() => { setShowBulkDelete(false); onRefresh?.(); }}
        />
      )}
    </div>
  );
}