import React, { useState, useEffect } from 'react';
import { Flag, Bot, Check, X, Loader2, AlertTriangle, Ban, Trash2, Undo2, MessageSquareReply } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CONTENT_TYPE_LABELS = {
  forum_post: 'Forum Post',
  forum_comment: 'Comment',
  review: 'Review',
  club_post: 'Club Post',
  discussion: 'Discussion',
  chat_message: 'Chat Message',
  other: 'User Report',
};

export default function FlaggedContentTab({ user: adminUser }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const all = await base44.entities.ReportedContent.list('-created_date', 200);
      setReports(all);
    } catch (e) {}
    setLoading(false);
  }

  async function handleAction(reportId, mode) {
    setProcessing(reportId);
    try {
      const res = await base44.functions.invoke('reviewReportedContent', { report_id: reportId, mode });
      loadReports();
    } catch (e) {
      alert('Error: ' + (e.message || 'Failed to process report'));
    }
    setProcessing(null);
  }

  async function dismissReport(reportId) {
    setProcessing(reportId);
    try {
      await base44.entities.ReportedContent.update(reportId, {
        status: 'dismissed',
        ai_verdict: 'dismissed',
        ai_reason: 'Dismissed by admin',
        reviewed_by: adminUser?.email,
        reviewed_at: new Date().toISOString(),
      });
      loadReports();
    } catch (e) {}
    setProcessing(null);
  }

  async function undoAction(reportId) {
    if (!confirm('Undo this action? This will reverse any warning/ban and attempt to restore the removed content.')) return;
    setProcessing(reportId);
    try {
      await base44.functions.invoke('reviewReportedContent', { report_id: reportId, mode: 'undo' });
      loadReports();
    } catch (e) {
      alert('Error: ' + (e.message || 'Failed to undo action'));
    }
    setProcessing(null);
  }

  const filtered = reports.filter(r => {
    // Hide school-routed reports — those are handled by the school admin
    if (r.routed_to === 'school') return false;
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'actioned') return r.status === 'actioned';
    if (filter === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'actioned', label: 'Actioned' },
          { id: 'dismissed', label: 'Dismissed' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: filter === f.id ? 'var(--lx-accent)' : 'var(--bg-card)',
              color: filter === f.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${filter === f.id ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--lx-accent)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Flag size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reports in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-xl p-4 space-y-3"
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${r.status === 'pending' ? 'rgba(249,115,22,0.4)' : r.status === 'actioned' ? 'rgba(248,113,113,0.3)' : 'var(--lx-border)'}`,
              }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                      {CONTENT_TYPE_LABELS[r.content_type] || r.content_type}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: r.status === 'pending' ? 'rgba(249,115,22,0.15)' : r.status === 'actioned' ? 'rgba(248,113,113,0.15)' : 'var(--bg-elevated)',
                        color: r.status === 'pending' ? '#f97316' : r.status === 'actioned' ? '#f87171' : 'var(--text-muted)',
                      }}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Reported by <span style={{ color: 'var(--text-secondary)' }}>{r.reporter_email}</span>
                    {' · '}
                    <span style={{ color: 'var(--lx-accent)' }}>{r.reason}</span>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    User: <span style={{ color: 'var(--text-secondary)' }}>{r.reported_user_email}</span>
                    {' · '}{new Date(r.created_date).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Content snapshot */}
              {r.content_snapshot && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Content:</p>
                  <p className="line-clamp-4" style={{ color: 'var(--text-secondary)' }}>{r.content_snapshot}</p>
                </div>
              )}

              {/* Reporter details */}
              {r.details && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-bold">Reporter note:</span> {r.details}
                </p>
              )}

              {/* School suggestion */}
              {r.school_suggested_action && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquareReply size={12} style={{ color: '#818cf8' }} />
                    <span className="text-xs font-bold" style={{ color: '#818cf8' }}>School Suggested Action</span>
                    {r.school_suggested_by && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· by {r.school_suggested_by}</span>}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.school_suggested_action}</p>
                </div>
              )}

              {/* AI verdict if already reviewed */}
              {r.status !== 'pending' && r.ai_verdict && (
                <div className="p-2 rounded-lg flex items-center gap-2 text-xs"
                  style={{
                    background: r.ai_verdict === 'upheld' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${r.ai_verdict === 'upheld' ? 'rgba(248,113,113,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  }}>
                  {r.ai_verdict === 'upheld' ? <AlertTriangle size={12} style={{ color: '#f87171' }} /> : <Check size={12} style={{ color: '#10b981' }} />}
                  <span style={{ color: r.ai_verdict === 'upheld' ? '#f87171' : '#10b981', fontWeight: 600 }}>
                    {r.ai_verdict === 'upheld' ? 'Violation upheld' : 'Report dismissed'}
                  </span>
                  {r.ai_reason && <span style={{ color: 'var(--text-muted)' }}>— {r.ai_reason}</span>}
                  {r.action_taken === 'warned' && <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>User Warned</span>}
                  {r.action_taken === 'banned' && <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>User Banned</span>}
                </div>
              )}

              {/* Action buttons for pending reports */}
              {r.status === 'pending' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => handleAction(r.id, 'ai')} disabled={processing === r.id}
                    className="lx-btn-primary text-xs flex items-center gap-1.5"
                    style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                    {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <Bot size={13} />}
                    AI Review
                  </button>
                  <button onClick={() => handleAction(r.id, 'manual')} disabled={processing === r.id}
                    className="lx-btn-ghost text-xs flex items-center gap-1.5"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                    {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={13} />}
                    Uphold Manually
                  </button>
                  <button onClick={() => dismissReport(r.id)} disabled={processing === r.id}
                    className="lx-btn-ghost text-xs flex items-center gap-1.5">
                    <X size={13} /> Dismiss
                  </button>
                </div>
              )}

              {/* Undo button for actioned reports */}
              {r.status === 'actioned' && ['warned', 'banned', 'content_removed'].includes(r.action_taken) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => undoAction(r.id)} disabled={processing === r.id}
                    className="lx-btn-ghost text-xs flex items-center gap-1.5"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={13} />}
                    Undo {r.action_taken === 'banned' ? 'Ban & Restore' : r.action_taken === 'warned' ? 'Warning & Restore' : 'Content'}
                  </button>
                  {!r.original_content && (
                    <span className="text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>
                      (content snapshot unavailable — warning/ban will be reversed but content cannot be restored)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="p-3 rounded-lg flex items-start gap-2"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--lx-border)' }}>
        <Bot size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> "AI Review" uses AI to check if the report is real or fake. If the content is genuinely objectionable, the user gets warned (1st & 2nd offense) then permanently banned (3rd offense). "Uphold Manually" skips AI and applies the same warning system. You must act on reports within 24 hours per App Store guidelines.
        </p>
      </div>
    </div>
  );
}