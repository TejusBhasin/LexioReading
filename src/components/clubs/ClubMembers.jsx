import React from 'react';
import { Users, Shield } from 'lucide-react';

export default function ClubMembers({ club, members, isAdmin }) {
  // Build display list: prefer ClubMemberTracking records but fall back to member_emails
  const trackingByEmail = Object.fromEntries((members || []).map(m => [m.user_email, m]));
  const memberEmails = club.member_emails || [];
  const displayList = memberEmails.length > 0
    ? memberEmails.map(email => trackingByEmail[email] || { user_email: email, username: email.split('@')[0] })
    : members;
  return (
    <div className="space-y-4">
      {displayList.length === 0 ? (
        <div className="lx-card p-8 text-center">
          <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No members yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayList.map((m, idx) => (
            <div key={m.id} className="lx-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {m.username ? `@${m.username}` : 'Anonymous'}
                  </p>
                </div>
                {m.role === 'admin' && <Shield size={14} style={{ color: 'var(--lx-accent)' }} />}
              </div>
              {club.club_type === 'administrative' && (
                <div className="text-xs space-y-1 mt-3" style={{ color: 'var(--text-muted)' }}>
                  <p>Pages: <span style={{ color: 'var(--text-primary)' }}>{m.pages_read || 0}</span></p>
                  <p>Time: <span style={{ color: 'var(--text-primary)' }}>{m.time_spent_minutes || 0}m</span></p>
                  <p>Sessions: <span style={{ color: 'var(--text-primary)' }}>{m.sessions_completed || 0}</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}