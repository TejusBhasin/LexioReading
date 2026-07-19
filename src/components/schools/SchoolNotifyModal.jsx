import React, { useState, useEffect } from 'react';
import { Send, X, AlertTriangle, Users, User, GraduationCap, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SchoolNotifyModal({ schoolId, schoolName, targetEmail, targetName, onClose, onSent }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [recipientType, setRecipientType] = useState(targetEmail ? 'student' : 'all');
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    if (schoolId && !targetEmail) {
      base44.entities.SchoolClass.filter({ school_id: schoolId })
        .then(setClasses)
        .catch(() => {});
    }
  }, [schoolId, targetEmail]);

  async function send() {
    if (!title.trim() || !message.trim()) return;
    if (recipientType === 'class' && !selectedClassId) return;
    setSending(true);
    setError('');
    try {
      const payload = {
        school_id: schoolId,
        title: title.trim(),
        message: message.trim(),
      };
      if (targetEmail) {
        payload.target_email = targetEmail;
      } else if (recipientType === 'class') {
        payload.class_id = selectedClassId;
      } else if (recipientType === 'students') {
        payload.target_group = 'students';
      } else if (recipientType === 'admins') {
        payload.target_group = 'admins';
      } else {
        payload.target_group = 'all';
      }
      const res = await base44.functions.invoke('schoolNotify', payload);
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

  const recipientLabel = targetEmail
    ? `To: ${targetName || targetEmail}`
    : recipientType === 'class'
      ? `To: ${classes.find(c => c.id === selectedClassId)?.class_name || 'Select a class'}`
      : recipientType === 'students'
        ? 'To: All Students'
        : recipientType === 'admins'
          ? 'To: All Admins'
          : `To all members of ${schoolName || 'your school'}`;

  const RecipientIcon = targetEmail || recipientType === 'student' ? User : recipientType === 'class' ? GraduationCap : recipientType === 'admins' ? Shield : Users;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
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

        {/* Recipient selector — only when no specific student is targeted */}
        {!targetEmail && (
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Recipients</label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                { id: 'all', label: 'All Members', icon: Users },
                { id: 'students', label: 'Students', icon: User },
                { id: 'admins', label: 'Admins', icon: Shield },
                { id: 'class', label: 'Class', icon: GraduationCap },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setRecipientType(id)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded text-xs font-medium transition-all"
                  style={{
                    background: recipientType === id ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                    color: recipientType === id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${recipientType === id ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  }}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
            {recipientType === 'class' && (
              <select className="lx-input text-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}{c.subject ? ` — ${c.subject}` : ''}</option>
                ))}
              </select>
            )}
            {recipientType === 'class' && classes.length === 0 && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>No classes found in this school.</p>
            )}
          </div>
        )}

        <div className="p-3 rounded-lg mb-4 flex items-center gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <RecipientIcon size={14} style={{ color: 'var(--lx-accent)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{recipientLabel}</p>
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
          <button onClick={send} disabled={!title.trim() || !message.trim() || sending || (recipientType === 'class' && !selectedClassId)}
            className="lx-btn-primary flex-1 justify-center text-sm">
            {sending ? 'Sending...' : <><Send size={14} /> Send</>}
          </button>
        </div>
      </div>
    </div>
  );
}