import React, { useState, useEffect } from 'react';
import { Check, X, School, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const all = await base44.entities.SchoolChangeRequest.list('-created_date', 100);
      setRequests(all);
    } catch (e) {}
    setLoading(false);
  }

  async function approve(req) {
    setActioning(req.id);
    try {
      const now = new Date().toISOString();
      await base44.entities.SchoolChangeRequest.update(req.id, {
        status: 'approved',
        admin_notes: req.admin_notes || 'Approved',
        reviewed_by: 'admin',
        reviewed_at: now,
      });
      if (req.request_type === 'email_domain') {
        await base44.entities.School.update(req.school_id, {
          email_domain: req.requested_email_domain,
          email_domain_status: 'approved',
        });
      } else {
        await base44.entities.School.update(req.school_id, { content_isolation: true });
      }
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved', reviewed_at: now } : r));
    } catch (e) {}
    setActioning(null);
  }

  async function reject(req) {
    const notes = prompt('Reason for rejection (optional):') || '';
    setActioning(req.id);
    try {
      const now = new Date().toISOString();
      await base44.entities.SchoolChangeRequest.update(req.id, {
        status: 'rejected',
        admin_notes: notes,
        reviewed_by: 'admin',
        reviewed_at: now,
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', admin_notes: notes, reviewed_at: now } : r));
    } catch (e) {}
    setActioning(null);
  }

  if (loading) {
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading requests...</div>;
  }

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Schools requesting content isolation or custom email domain approval.
      </p>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <School size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No school change requests.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--lx-accent)' }}>Pending ({pending.length})</p>
          {pending.map(req => (
            <div key={req.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid rgba(249,115,22,0.4)' }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{req.school_name || 'Unknown School'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Requested by {req.admin_email} · {new Date(req.created_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)' }}>
                    {req.request_type === 'email_domain' ? 'Email Domain' : 'Content Isolation'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1" style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)' }}>
                    <Clock size={10} /> Pending
                  </span>
                </div>
              </div>
              {req.request_type === 'email_domain' && req.requested_email_domain && (
                <div className="p-3 rounded" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: '#818cf8' }}>Requested Email Domain</p>
                  <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>@{req.requested_email_domain}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Users signing up with this domain will auto-join this school.</p>
                </div>
              )}
              {req.reason && (
                <p className="text-sm p-3 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  "{req.reason}"
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => approve(req)} disabled={actioning === req.id}
                  className="lx-btn-primary text-sm flex-1 justify-center">
                  <Check size={13} /> {req.request_type === 'email_domain' ? 'Approve Domain' : 'Approve & Isolate'}
                </button>
                <button onClick={() => reject(req)} disabled={actioning === req.id}
                  className="lx-btn-ghost text-sm flex-1 justify-center" style={{ color: '#f87171' }}>
                  <X size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Resolved ({resolved.length})</p>
          {resolved.map(req => (
            <div key={req.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', opacity: 0.7 }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{req.school_name || 'Unknown School'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {req.admin_email} · {new Date(req.created_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                  color: req.status === 'approved' ? '#10b981' : '#f87171',
                  background: req.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                }}>
                  {req.status}
                </span>
              </div>
              {req.admin_notes && (
                <p className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {req.admin_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}