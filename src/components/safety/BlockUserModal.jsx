import React, { useState } from 'react';
import { X, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BlockUserModal({ blockedEmail, blockedUsername, onClose }) {
  const [blocking, setBlocking] = useState(false);
  const [done, setDone] = useState(false);

  async function block() {
    if (!blockedEmail) return;
    setBlocking(true);
    try {
      const me = await base44.auth.me();
      // Create block record
      await base44.entities.UserBlock.create({
        blocker_email: me.email,
        blocked_email: blockedEmail,
        blocked_username: blockedUsername || '',
      });
      // Also auto-report so the developer is notified of potentially abusive content
      const existing = await base44.entities.ReportedContent.filter({
        reporter_email: me.email,
        reported_user_email: blockedEmail,
      });
      if (existing.length === 0) {
        await base44.entities.ReportedContent.create({
          reporter_email: me.email,
          reported_user_email: blockedEmail,
          content_type: 'other',
          content_id: 'user_block_' + Date.now(),
          content_snapshot: `User blocked @${blockedUsername || blockedEmail}`,
          reason: 'other',
          details: `User blocked @${blockedUsername || blockedEmail} via block button`,
          status: 'pending',
        });
      }
      setDone(true);
    } catch (e) {}
    setBlocking(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(248,113,113,0.15)' }}>
              <Ban size={22} style={{ color: '#f87171' }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>User blocked</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Their content will no longer appear in your feeds. We've also notified our moderation team.
            </p>
            <button onClick={onClose} className="lx-btn-primary w-full justify-center text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Ban size={16} style={{ color: '#f87171' }} /> Block User
              </h2>
              <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Block <span style={{ color: 'var(--lx-accent)' }}>@{blockedUsername || blockedEmail}</span>?
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Their posts, comments, and reviews will be hidden from your view. This also notifies our moderation team to review their content.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center text-sm">Cancel</button>
              <button onClick={block} disabled={blocking} className="lx-btn-primary flex-1 justify-center text-sm"
                style={{ background: '#f87171', color: '#fff' }}>
                {blocking ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}