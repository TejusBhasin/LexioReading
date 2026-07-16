import React, { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate', label: 'Hate speech or discrimination' },
  { value: 'explicit', label: 'Explicit or sexual content' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Other' },
];

export default function ReportContentModal({ contentType, contentId, contentSnapshot, reportedUserEmail, reportedUsername, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke('createContentReport', {
        reported_user_email: reportedUserEmail,
        content_type: contentType,
        content_id: contentId,
        content_snapshot: contentSnapshot || '',
        reason,
        details: details.trim(),
      });
      setDone(true);
    } catch (e) {}
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Flag size={22} style={{ color: '#10b981' }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Report submitted</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Your report has been routed to the appropriate team for review.</p>
            <button onClick={onClose} className="lx-btn-primary w-full justify-center text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Flag size={16} style={{ color: 'var(--lx-accent)' }} /> Report Content
              </h2>
              <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            {reportedUsername && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Reporting content by <span style={{ color: 'var(--lx-accent)' }}>@{reportedUsername}</span>
              </p>
            )}
            <div className="space-y-1.5 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className="w-full text-left px-3 py-2 rounded text-sm transition-all"
                  style={{
                    background: reason === r.value ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${reason === r.value ? '#f87171' : 'var(--lx-border)'}`,
                    color: reason === r.value ? '#f87171' : 'var(--text-secondary)',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea className="lx-input text-sm resize-none mb-4" rows={3}
              placeholder="Additional details (optional)..."
              value={details} onChange={e => setDetails(e.target.value)} />
            <button onClick={submit} disabled={!reason || submitting} className="lx-btn-primary w-full justify-center text-sm">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              False reports may result in account action.
            </p>
          </>
        )}
      </div>
    </div>
  );
}