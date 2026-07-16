import React, { useState } from 'react';
import { Archive, X, AlertTriangle, Download, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REASONS = [
  'Graduated',
  'Left school / transferred',
  'No longer enrolled',
  'Disciplinary removal',
  'Other',
];

export default function OffboardStudentModal({ studentEmail, studentName, schoolId, onClose, onDone }) {
  const [reason, setReason] = useState(REASONS[1]);
  const [customReason, setCustomReason] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [offboarding, setOffboarding] = useState(false);
  const [error, setError] = useState('');

  async function downloadData() {
    setExporting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('exportStudentData', {
        student_email: studentEmail,
        school_id: schoolId,
      });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (studentName || studentEmail.split('@')[0]).replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${safeName}_reading_data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (e) {
      setError('Failed to export data. You can still offboard — data is preserved on the server.');
    }
    setExporting(false);
  }

  async function offboard() {
    setOffboarding(true);
    setError('');
    try {
      const finalReason = reason === 'Other' ? customReason.trim() : reason;
      const res = await base44.functions.invoke('offboardStudent', {
        student_email: studentEmail,
        school_id: schoolId,
        reason: finalReason,
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        onDone();
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to offboard student. Please try again.');
    }
    setOffboarding(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,162,158,0.15)' }}>
              <Archive size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Offboard Student</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Offboarding <strong style={{ color: 'var(--text-primary)' }}>{studentName || studentEmail}</strong>
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          The student will lose school access immediately. All reading data (logs, library, reviews) is preserved — they can continue using Lexio independently.
        </p>

        {/* Step 1: Export data */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Step 1: Export Student Data (recommended)</p>
          <button onClick={downloadData} disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
            style={{
              background: exportDone ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
              color: exportDone ? '#10b981' : 'var(--text-secondary)',
              border: `1px solid ${exportDone ? 'rgba(16,185,129,0.3)' : 'var(--lx-border)'}`,
            }}>
            {exporting ? 'Exporting...' : exportDone ? <><Check size={12} /> Data Exported</> : <><Download size={12} /> Download Reading Data</>}
          </button>
        </div>

        {/* Step 2: Select reason */}
        <div className="mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Step 2: Reason for Offboarding</p>
          <select className="lx-input text-sm mb-2" value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {reason === 'Other' && (
            <input className="lx-input text-sm" placeholder="Specify reason..."
              value={customReason} onChange={e => setCustomReason(e.target.value)} />
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center text-sm">Cancel</button>
          <button onClick={offboard} disabled={offboarding}
            className="flex-1 py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: 'rgba(168,162,158,0.9)', color: '#fff', border: 'none', cursor: offboarding ? 'not-allowed' : 'pointer' }}>
            <Archive size={14} /> {offboarding ? 'Offboarding...' : 'Offboard Student'}
          </button>
        </div>

        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
          This removes school access. Data is preserved on the server.
        </p>
      </div>
    </div>
  );
}