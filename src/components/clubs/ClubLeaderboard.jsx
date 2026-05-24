import React from 'react';
import { Trophy } from 'lucide-react';

export default function ClubLeaderboard({ club, members }) {
  const sorted = [...members].sort((a, b) => (b.pages_read || 0) - (a.pages_read || 0));

  return (
    <div>
      <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Trophy size={18} style={{ color: 'var(--lx-accent)' }} />
        Member Rankings
      </h2>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="lx-card p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
          </div>
        ) : (
          sorted.map((m, idx) => (
            <div key={m.id} className="lx-card p-4 flex items-center gap-4">
              <div className="font-display text-2xl font-bold w-8 text-center" style={{ color: 'var(--lx-accent)' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.username || m.user_email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: 'var(--lx-accent)' }}>{m.pages_read || 0} pages</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.sessions_completed || 0} sessions</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}