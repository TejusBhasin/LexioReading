import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Crown, BookOpen, Clock, Calendar } from 'lucide-react';

export default function ClubMembers({ club, members, isAdmin }) {
  const trackingByEmail = Object.fromEntries((members || []).map(m => [m.user_email, m]));
  const memberEmails = club.member_emails || [];
  const displayList = memberEmails.length > 0
    ? memberEmails.map(email => trackingByEmail[email] || { user_email: email, username: email.split('@')[0] })
    : members;

  const creatorEmail = club.creator_email;

  return (
    <div className="space-y-4">
      {displayList.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No members yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Invite readers to join your club!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayList.map((m) => {
            const isCreator = m.user_email === creatorEmail;
            const initial = (m.username || m.user_email || '?')[0]?.toUpperCase();
            const hasStats = m.pages_read || m.time_spent_minutes || m.sessions_completed;

            return (
              <div key={m.id || m.user_email} className="lx-card p-4 transition-all hover:border-[var(--lx-accent)]">
                <div className="flex items-start gap-3">
                  <Link to={`/u/${m.username}`} className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: isCreator ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: isCreator ? 'var(--bg-primary)' : 'var(--lx-accent)', border: `1px solid ${isCreator ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                      {initial}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.username ? (
                        <Link to={`/u/${m.username}`} className="font-medium text-sm hover:underline truncate" style={{ color: 'var(--text-primary)' }}>
                          @{m.username}
                        </Link>
                      ) : (
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>Anonymous</p>
                      )}
                      {isCreator && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"
                          style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--lx-accent)' }}>
                          <Crown size={9} /> Creator
                        </span>
                      )}
                    </div>
                    {m.joined_date && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={9} /> Joined {new Date(m.joined_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {hasStats && (
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                    <div className="text-center">
                      <BookOpen size={12} className="mx-auto mb-0.5" style={{ color: 'var(--lx-accent)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.pages_read || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>pages</p>
                    </div>
                    <div className="text-center">
                      <Clock size={12} className="mx-auto mb-0.5" style={{ color: 'var(--lx-accent)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.time_spent_minutes || 0}m</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>read</p>
                    </div>
                    <div className="text-center">
                      <Users size={12} className="mx-auto mb-0.5" style={{ color: 'var(--lx-accent)' }} />
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.sessions_completed || 0}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>sessions</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}