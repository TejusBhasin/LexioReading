import React, { useState } from 'react';
import { Send, X, AlertTriangle, Users, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolNotifyModal({ schoolId, schoolName, targetEmail, targetName, onClose, onSent }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await base44.functions.invoke('schoolNotify', {
        school_id: schoolId,
        target_email: targetEmail || null,
        title: title.trim(),
        message: message.trim(),
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        onSent(res.data);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send notification. Please try again.');
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <Send size={16} style={{ color: 'var(--lx-accent)' }} />
            </div>
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Send Notification</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-3 rounded-lg mb-4 flex items-center gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          {targetEmail ? <User size={14} style={{ color: 'var(--lx-accent)' }} /> : <Users size={14} style={{ color: 'var(--lx-accent)' }} />}
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {targetEmail ? `To: ${targetName || targetEmail}` : `To all members of ${schoolName || 'your school'}`}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Title</label>
          <input className="lx-input text-sm" placeholder="Notification title..."
            value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Message</label>
          <textarea className="lx-input text-sm resize-none" rows={4}
            placeholder="Write your message..."
            value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} />
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center text-sm">Cancel</button>
          <button onClick={send} disabled={!title.trim() || !message.trim() || sending}
            className="lx-btn-primary flex-1 justify-center text-sm">
            {sending ? 'Sending...' : <><Send size={14} /> Send</>}
          </button>
        </div>
      </div>
    </div>
  );
}