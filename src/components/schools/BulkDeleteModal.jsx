import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BulkDeleteModal({ schoolId, schoolName, onClose, onDone }) {
  const [emails, setEmails] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('input');
  const [results, setResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  const parsedEmails = emails
    .split(/[\n,;\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@') && e.includes('.'));

  async function execute() {
    setProcessing(true);
    setStep('processing');
    try {
      const res = await base44.functions.invoke('bulkDeleteAccounts', {
        school_id: schoolId,
        emails: parsedEmails,
        reason: reason.trim(),
      });
      setResults(res.data);
      setStep('results');
    } catch (e) {
      setResults({ error: e.response?.data?.error || e.message || 'Failed to delete accounts' });
      setStep('results');
    }
    setProcessing(false);
  }

  const hasErrors = results?.summary?.errors > 0;
  const resultsStyle = {
    background: hasErrors ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
    border: '1px solid ' + (hasErrors ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.3)'),
  };
  const resultsIconColor = hasErrors ? '#f97316' : '#10b981';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid rgba(248,113,113,0.4)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: '#f87171' }}>
            <Trash2 size={18} /> Bulk Delete Accounts
          </h2>
          <button onClick={onClose} disabled={processing}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        {/* INPUT STEP */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                This will <strong style={{ color: '#f87171' }}>permanently delete</strong> the accounts and all associated data (reading logs, reviews, library, vault, posts, comments) for each email listed. This cannot be undone.
              </p>
            </div>

            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Student Emails</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Paste emails below — one per line, or separated by commas.</p>
              <textarea
                className="lx-input text-sm resize-none font-mono"
                rows={6}
                placeholder={'student1@school.org\nstudent2@school.org\nstudent3@school.org'}
                value={emails}
                onChange={e => setEmails(e.target.value)}
              />
              {parsedEmails.length > 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--lx-accent)' }}>
                  {parsedEmails.length} email{parsedEmails.length !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>

            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-muted)' }}>Reason (optional)</label>
              <input
                className="lx-input text-sm"
                placeholder="e.g. Graduated, left school, etc."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStep('confirm')}
              disabled={parsedEmails.length === 0}
              className="lx-btn-primary w-full justify-center text-sm"
              style={{ background: '#f87171', color: '#fff' }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)' }}>
              <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: '#f87171' }} />
              <p className="font-bold text-sm mb-1" style={{ color: '#f87171' }}>Confirm Deletion</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                You are about to permanently delete <strong style={{ color: '#f87171' }}>{parsedEmails.length}</strong> account{parsedEmails.length !== 1 ? 's' : ''} from <strong style={{ color: 'var(--text-primary)' }}>{schoolName}</strong>.
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg p-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
              {parsedEmails.map((e, i) => (
                <p key={i} className="text-xs font-mono py-0.5" style={{ color: 'var(--text-secondary)' }}>{e}</p>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('input')} className="lx-btn-ghost flex-1 justify-center text-sm">
                ← Back
              </button>
              <button
                onClick={execute}
                disabled={processing}
                className="flex-1 py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: '#f87171', color: '#fff' }}
              >
                <Trash2 size={14} /> Delete {parsedEmails.length} Account{parsedEmails.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#f87171' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Deleting accounts...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This may take a moment. Do not close this window.</p>
          </div>
        )}

        {/* RESULTS STEP */}
        {step === 'results' && (
          <div className="space-y-4">
            {results?.error ? (
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)' }}>
                <AlertTriangle size={28} className="mx-auto mb-2" style={{ color: '#f87171' }} />
                <p className="font-bold text-sm mb-1" style={{ color: '#f87171' }}>Error</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{results.error}</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg text-center" style={resultsStyle}>
                  <Check size={28} className="mx-auto mb-2" style={{ color: resultsIconColor }} />
                  <p className="font-bold text-sm mb-2" style={{ color: resultsIconColor }}>Deletion Complete</p>
                  <div className="flex justify-center gap-4 text-xs">
                    <span style={{ color: '#10b981' }}><strong>{results.summary.deleted}</strong> deleted</span>
                    {results.summary.skipped > 0 && <span style={{ color: 'var(--text-muted)' }}><strong>{results.summary.skipped}</strong> skipped</span>}
                    {results.summary.errors > 0 && <span style={{ color: '#f87171' }}><strong>{results.summary.errors}</strong> errors</span>}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded text-xs" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{r.email}</span>
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 rounded font-bold"
                        style={{
                          background: r.status === 'deleted' ? 'rgba(16,185,129,0.15)' : r.status === 'skipped' ? 'var(--bg-card)' : 'rgba(248,113,113,0.15)',
                          color: r.status === 'deleted' ? '#10b981' : r.status === 'skipped' ? 'var(--text-muted)' : '#f87171',
                        }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => { onDone?.(); onClose?.(); }} className="lx-btn-primary w-full justify-center text-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}