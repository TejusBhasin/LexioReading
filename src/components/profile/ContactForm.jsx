import React, { useState, useEffect } from 'react';
import { Send, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ContactForm({ user }) {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { if (user?.email) loadHistory(); }, [user]);

  async function loadHistory() {
    const reqs = await base44.entities.ContactRequest.filter({ user_email: user.email }, '-created_date', 20);
    setMyRequests(reqs);
  }

  async function submit() {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    await base44.entities.ContactRequest.create({
      ...form,
      user_email: user.email,
      username: user.full_name || user.email,
    });
    setForm({ subject: '', message: '' });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    loadHistory();
    setSending(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Contact Us</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Have a question, issue, or feedback? We'll get back to you.</p>
      </div>

      <div className="lx-card p-5 space-y-3">
        <input className="lx-input text-sm" placeholder="Subject..."
          value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
        <textarea className="lx-input text-sm resize-none" rows={4} placeholder="Your message..."
          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        <button onClick={submit} disabled={sending || !form.subject.trim() || !form.message.trim()} className="lx-btn-primary text-sm">
          {sent ? <><Check size={13} /> Sent!</> : sending ? 'Sending...' : <><Send size={13} /> Send Message</>}
        </button>
      </div>

      {myRequests.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(o => !o)} className="text-sm mb-3" style={{ color: 'var(--lx-accent)' }}>
            {showHistory ? 'Hide' : 'View'} my previous requests ({myRequests.length})
          </button>
          {showHistory && (
            <div className="space-y-3">
              {myRequests.map(req => (
                <div key={req.id} className="lx-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{req.subject}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: req.status === 'replied' ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                      color: req.status === 'replied' ? '#10b981' : 'var(--text-muted)'
                    }}>{req.status}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{req.message}</p>
                  {req.admin_reply && (
                    <div className="p-3 rounded text-sm" style={{ background: 'rgba(245,166,35,0.1)', borderLeft: '2px solid var(--lx-accent)' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>Admin Reply</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{req.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}