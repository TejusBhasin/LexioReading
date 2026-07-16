import React, { useState, useEffect } from 'react';
import { Ban, X, AlertTriangle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BanStudentModal({ studentEmail, studentName, incidentId, onClose, onBanned }) {
  const [duration, setDuration] = useState(3);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(null);
  const [loadingCooldown, setLoadingCooldown] = useState(true);

  useEffect(() => {
    checkCooldown();
  }, []);

  async function checkCooldown() {
    setLoadingCooldown(true);
    try {
      const res = await base44.functions.invoke('schoolBanStudent', { action: 'check_cooldown' });
      setCooldown(res.data);
    } catch (e) {
      setCooldown({ onCooldown: false });
    }
    setLoadingCooldown(false);
  }

  async function submitBan() {
    setSubmitting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('schoolBanStudent', {
        action: 'ban',
        student_email: studentEmail,
        student_name: studentName,
        ban_duration_days: duration,
        reason: reason.trim(),
        incident_id: incidentId || null,
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        onBanned(res.data);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to ban student. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.15)' }}>
              <Ban size={16} style={{ color: '#f87171' }} />
            </div>
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ban Student</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Banning <strong style={{ color: 'var(--text-primary)' }}>{studentName || studentEmail}</strong>
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          The student will be unable to access Lexio until the ban expires.
        </p>

        {/* Cooldown status */}
        {loadingCooldown ? (
          <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={12} /> Checking ban availability...
          </div>
        ) : cooldown?.onCooldown ? (
          <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f97316' }} />
            <p className="text-xs" style={{ color: '#f97316' }}>{cooldown.message}</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg mb-4 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Clock size={14} style={{ color: '#10b981' }} />
            <p className="text-xs" style={{ color: '#10b981' }}>You can issue a ban now.</p>
          </div>
        )}

        {/* Duration selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Ban Duration (max 7 days)</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5, 7].map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className="py-2 rounded text-sm font-medium transition-all"
                style={{
                  background: duration === d ? 'rgba(248,113,113,0.2)' : 'var(--bg-elevated)',
                  color: duration === d ? '#f87171' : 'var(--text-secondary)',
                  border: `1px solid ${duration === d ? 'rgba(248,113,113,0.4)' : 'var(--lx-border)'}`,
                }}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Reason (optional)</label>
          <textarea className="lx-input text-sm resize-none" rows={2}
            placeholder="Why is this student being banned?"
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center text-sm">Cancel</button>
          <button onClick={submitBan} disabled={submitting || cooldown?.onCooldown}
            className="flex-1 py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: submitting || cooldown?.onCooldown ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.9)',
              color: '#fff',
              border: 'none',
              cursor: submitting || cooldown?.onCooldown ? 'not-allowed' : 'pointer',
            }}>
            <Ban size={14} /> {submitting ? 'Banning...' : `Ban for ${duration} day${duration > 1 ? 's' : ''}`}
          </button>
        </div>

        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
          <Clock size={10} className="inline mr-1" />
          You can issue one ban every 14 days.
        </p>
      </div>
    </div>
  );
}