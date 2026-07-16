import React, { useState, useEffect } from 'react';
import { Send, Check, School, Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ContactForm({ user }) {
  const [form, setForm] = useState({ subject: '', message: '', recipient: 'lexio_admins' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    if (user?.email) {
      loadHistory();
      loadSchool();
    }
  }, [user]);

  async function loadHistory() {
    const reqs = await base44.entities.ContactRequest.filter({ user_email: user.email }, '-created_date', 20);
    setMyRequests(reqs);
  }

  async function loadSchool() {
    try {
      const memberships = await base44.entities.SchoolMember.filter({ user_email: user.email, kicked: false });
      const active = memberships.find(m => !m.dual_mode_enabled || m.currently_school_mode);
      if (active) {
        const schools = await base44.entities.School.filter({ id: active.school_id });
        if (schools[0]) setSchool(schools[0]);
      }
    } catch (e) {}
  }

  async function submit() {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    await base44.entities.ContactRequest.create({
      subject: form.subject,
      message: form.message,
      user_email: user.email,
      username: user.full_name || user.email,
      recipient: form.recipient,
      school_id: form.recipient === 'school' ? school?.id : '',
      school_name: form.recipient === 'school' ? school?.name : '',
    });
    setForm(f => ({ subject: '', message: '', recipient: f.recipient }));
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    loadHistory();
    setSending(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Contact Us</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Have a question, issue, or feedback? Choose who to send it to.</p>
      </div>

      {/* Recipient selector */}
      {school ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setForm(f => ({ ...f, recipient: 'school' }))}
            className="flex items-center gap-2 p-3 rounded-lg text-sm transition-all"
            style={{
              background: form.recipient === 'school' ? 'var(--lx-accent)' : 'var(--bg-elevated)',
              color: form.recipient === 'school' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${form.recipient === 'school' ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}>
            <School size={14} /> {school.name}
          </button>
          <button
            onClick={() => setForm(f => ({ ...f, recipient: 'lexio_admins' }))}
            className="flex items-center gap-2 p-3 rounded-lg text-sm transition-all"
            style={{
              background: form.recipient === 'lexio_admins' ? 'var(--lx-accent)' : 'var(--bg-elevated)',
              color: form.recipient === 'lexio_admins' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${form.recipient === 'lexio_admins' ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}>
            <Bot size={14} /> Lexio Support
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)', color: 'var(--text-muted)' }}>
          <Bot size={14} /> Your message will be sent to Lexio Support.
        </div>
      )}

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
                    <div className="flex items-center gap-1.5">
                      {req.recipient === 'school' && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                          {req.school_name || 'School'}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: req.status === 'replied' ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                        color: req.status === 'replied' ? '#10b981' : 'var(--text-muted)'
                      }}>{req.status}</span>
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{req.message}</p>
                  {req.admin_reply && (
                    <div className="p-3 rounded text-sm" style={{ background: 'rgba(245,166,35,0.1)', borderLeft: '2px solid var(--lx-accent)' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>
                        {req.recipient === 'school' ? 'School Reply' : 'Admin Reply'}
                      </p>
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