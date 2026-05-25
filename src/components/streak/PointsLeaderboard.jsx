import React, { useState, useEffect } from 'react';
import { Trophy, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PointsLeaderboard({ currentUserEmail }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const all = await base44.entities.UserPoints.filter({ leaderboard_opt_in: true }, '-total_points', 50);
      // Deduplicate by email (keep highest)
      const seen = {};
      const deduped = [];
      for (const p of all) {
        if (!seen[p.user_email]) {
          seen[p.user_email] = true;
          deduped.push(p);
        }
      }
      setLeaders(deduped.slice(0, 20));
    } catch (e) {}
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center"><div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Global Leaderboard</h2>
      </div>

      {leaders.length === 0 ? (
        <div className="lx-card p-8 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>No one has opted in yet.</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enable leaderboard in your Reading Log settings.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((p, i) => (
            <div key={p.id} className="lx-card p-4 flex items-center gap-4"
              style={{ borderColor: p.user_email === currentUserEmail ? 'var(--lx-accent)' : undefined }}>
              <span className="text-xl flex-shrink-0 w-8 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {p.username || p.user_email.split('@')[0]}
                  {p.user_email === currentUserEmail && <span className="ml-2 text-xs" style={{ color: 'var(--lx-accent)' }}>(you)</span>}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  🔥 {p.streak_days || 0} day streak
                </p>
              </div>
              <div className="flex items-center gap-1 font-display font-bold" style={{ color: 'var(--lx-accent)' }}>
                <Zap size={14} />
                {p.total_points || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}