import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BookOpen, Clock, TrendingUp } from 'lucide-react';

export default function ClubLeaderboard({ club, members }) {
  const sorted = [...members].sort((a, b) => (b.pages_read || 0) - (a.pages_read || 0));
  const maxPages = sorted[0]?.pages_read || 1;
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (sorted.length === 0) {
    return (
      <div>
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Trophy size={18} style={{ color: 'var(--lx-accent)' }} />
          Member Rankings
        </h2>
        <div className="lx-card p-10 text-center">
          <Trophy size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Rankings appear as members log reading sessions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Trophy size={18} style={{ color: 'var(--lx-accent)' }} />
        Member Rankings
      </h2>

      {/* Podium for top 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {podium.map((m, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            const colors = ['var(--lx-accent)', '#818cf8', '#f97316'];
            const initial = (m.username || m.user_email || '?')[0]?.toUpperCase();
            const height = idx === 0 ? 'pt-2' : idx === 1 ? 'pt-6' : 'pt-8';
            return (
              <Link to={m.username ? `/u/${m.username}` : '#'} key={m.id || m.user_email} className={`lx-card p-3 text-center transition-all hover:border-[var(--lx-accent)] ${height}`}
                style={{ borderColor: colors[idx], borderWidth: '1px' }}>
                <div className="text-2xl mb-1">{medals[idx]}</div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-1.5"
                  style={{ background: colors[idx], color: 'var(--bg-primary)' }}>
                  {initial}
                </div>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.username ? `@${m.username}` : 'Reader'}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: colors[idx] }}>{m.pages_read || 0}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>pages</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Remaining rankings */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((m, idx) => {
            const rank = idx + 4;
            const initial = (m.username || m.user_email || '?')[0]?.toUpperCase();
            const pct = Math.round(((m.pages_read || 0) / maxPages) * 100);
            return (
              <div key={m.id || m.user_email} className="lx-card p-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold w-6 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{rank}</span>
                  <Link to={m.username ? `/u/${m.username}` : '#'} className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>
                      {initial}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={m.username ? `/u/${m.username}` : '#'} className="text-sm font-medium hover:underline truncate block" style={{ color: 'var(--text-primary)' }}>
                      {m.username ? `@${m.username}` : 'Reader'}
                    </Link>
                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--lx-accent)' }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--lx-accent)' }}>{m.pages_read || 0}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>pages</p>
                  </div>
                </div>
                {(m.sessions_completed || m.time_spent_minutes) && (
                  <div className="flex gap-3 mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--lx-border)', color: 'var(--text-muted)' }}>
                    {m.sessions_completed > 0 && <span className="flex items-center gap-1"><BookOpen size={9} /> {m.sessions_completed} sessions</span>}
                    {m.time_spent_minutes > 0 && <span className="flex items-center gap-1"><Clock size={9} /> {m.time_spent_minutes}m</span>}
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