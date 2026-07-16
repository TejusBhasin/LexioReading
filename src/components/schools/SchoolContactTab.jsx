import React, { useState, useEffect } from 'react';
import { Send, Mail, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolContactTab({ school, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { if (school?.id) load(); }, [school]);

  async function load() {
    setLoading(true);
    try {
      const reqs = await base44.entities.ContactRequest.filter(
        { recipient: 'school', school_id: school.id },
        '-created_date',
        50
      );
      setRequests(reqs);
    } catch (e) {}
    setLoading(false);
  }

  async function sendReply(req) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await base44.entities.ContactRequest.update(req.id, {
        admin_reply: replyText.trim(),
        status: 'replied',
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, admin_reply: replyText.trim(), status: 'replied' } : r));
      setReplyingId(null);
      setReplyText('');
    } catch (e) {}
    setSending(false);
  }

  async function closeRequest(req) {
    await base44.entities.ContactRequest.update(req.id, { status: 'closed' });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'closed' } : r));
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (requests.length === 0) return (
    <div className="text-center py-12">
      <Mail size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No contact requests from students yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Messages students sent to your school.</p>
      {requests.map(req => (
        <div key={req.id} className="lx-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{req.subject}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>From {req.username || req.user_email} · {new Date(req.created_date).toLocaleDateString()}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded" style={{
              background: req.status === 'replied' ? 'rgba(16,185,129,0.15)' : req.status === 'closed' ? 'var(--bg-elevated)' : 'rgba(245,166,35,0.15)',
              color: req.status === 'replied' ? '#10b981' : req.status === 'closed' ? 'var(--text-muted)' : 'var(--lx-accent)'
            }}>{req.status}</span>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{req.message}</p>

          {req.admin_reply && (
            <div className="p-3 rounded text-sm mb-3" style={{ background: 'rgba(245,166,35,0.1)', borderLeft: '2px solid var(--lx-accent)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>Your Reply</p>
              <p style={{ color: 'var(--text-secondary)' }}>{req.admin_reply}</p>
            </div>
          )}

          {req.status !== 'closed' && (
            <>
              {replyingId === req.id ? (
                <div className="space-y-2">
                  <textarea className="lx-input text-sm resize-none" rows={2} placeholder="Type your reply..."
                    value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => sendReply(req)} disabled={sending || !replyText.trim()} className="lx-btn-primary text-sm flex-1 justify-center">
                      <Send size={13} /> {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button onClick={() => { setReplyingId(null); setReplyText(''); }} className="lx-btn-ghost text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setReplyingId(req.id); setReplyText(req.admin_reply || ''); }} className="lx-btn-ghost text-sm">
                    <Send size={13} /> {req.admin_reply ? 'Edit Reply' : 'Reply'}
                  </button>
                  {req.status === 'replied' && (
                    <button onClick={() => closeRequest(req)} className="lx-btn-ghost text-sm">
                      <CheckCircle size={13} /> Close
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}