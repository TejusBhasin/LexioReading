import React, { useState, useEffect } from 'react';
import { Flame, Shield, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StreakPanel({ user }) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingUltra, setActivatingUltra] = useState(false);

  useEffect(() => {
    if (user?.email) loadPoints();
  }, [user]);

  async function loadPoints() {
    try {
      const data = await base44.entities.UserPoints.filter({ user_email: user.email });
      if (data[0]) {
        const rec = await applyAutoFreeze(data[0]);
        setPoints(rec);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function applyAutoFreeze(rec) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (!rec.last_log_date || rec.last_log_date === today) return rec;
    if (rec.ultra_freeze_active && rec.ultra_freeze_expires && rec.ultra_freeze_expires >= today) return rec;
    if (rec.last_log_date !== yesterday && rec.streak_days > 0) {
      if (rec.streak_freeze_count > 0) {
        return base44.entities.UserPoints.update(rec.id, {
          streak_freeze_count: rec.streak_freeze_count - 1,
          last_log_date: yesterday,
        });
      } else {
        return base44.entities.UserPoints.update(rec.id, { streak_days: 0 });
      }
    }
    return rec;
  }

  async function buyFreeze() {
    if (!points || points.total_points < 15) return;
    const updated = await base44.entities.UserPoints.update(points.id, {
      streak_freeze_count: (points.streak_freeze_count || 0) + 1,
      total_points: points.total_points - 15,
    });
    setPoints(updated);
  }

  async function activateUltraFreeze() {
    if (!points || points.total_points < 30) return;
    setActivatingUltra(true);
    const expires = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const updated = await base44.entities.UserPoints.update(points.id, {
      ultra_freeze_active: true,
      ultra_freeze_expires: expires,
      total_points: points.total_points - 30,
    });
    setPoints(updated);
    setActivatingUltra(false);
  }

  async function toggleLeaderboard() {
    if (!points) return;
    const updated = await base44.entities.UserPoints.update(points.id, {
      leaderboard_opt_in: !points.leaderboard_opt_in,
    });
    setPoints(updated);
  }

  if (loading) return null;
  if (!points) return null;

  const totalPts = points.total_points || 0;
  const freezes = points.streak_freeze_count || 0;
  const ultraActive = points.ultra_freeze_active;

  return (
    <div className="lx-card p-5 mb-6">
      <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Flame size={16} style={{ color: 'var(--lx-accent)' }} />
        Streak &amp; Points
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
          <div className="text-2xl mb-1">🔥</div>
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{points.streak_days || 0}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Day streak</div>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
          <Zap size={20} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{totalPts}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total points</div>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
          <Shield size={20} className="mx-auto mb-1" style={{ color: freezes > 0 ? '#60a5fa' : 'var(--text-muted)' }} />
          <div className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{freezes}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Freezes</div>
        </div>
        <div className="p-3 rounded-lg text-center"
          style={{ background: ultraActive ? 'rgba(96,165,250,0.1)' : 'var(--bg-elevated)', border: ultraActive ? '1px solid #60a5fa' : 'none' }}>
          <div className="text-2xl mb-1">{ultraActive ? '🛡️' : '❄️'}</div>
          <div className="text-xs font-bold" style={{ color: ultraActive ? '#60a5fa' : 'var(--text-muted)' }}>
            {ultraActive ? 'Ultra Active' : 'Ultra Off'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>7-day shield</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={buyFreeze} disabled={totalPts < 15}
          className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-all"
          style={{ background: 'var(--bg-elevated)', color: totalPts >= 15 ? 'var(--text-primary)' : 'var(--text-muted)', border: '1px solid var(--lx-border)', opacity: totalPts >= 15 ? 1 : 0.5 }}>
          <Shield size={11} /> Buy Freeze (15 pts)
        </button>
        {!ultraActive && (
          <button onClick={activateUltraFreeze} disabled={totalPts < 30 || activatingUltra}
            className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-all"
            style={{ background: 'rgba(96,165,250,0.1)', color: totalPts >= 30 ? '#60a5fa' : 'var(--text-muted)', border: `1px solid ${totalPts >= 30 ? '#60a5fa' : 'var(--lx-border)'}`, opacity: totalPts >= 30 ? 1 : 0.5 }}>
            ❄️ Ultra Freeze (30 pts, 7 days)
          </button>
        )}
        <button onClick={toggleLeaderboard}
          className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-all ml-auto"
          style={{ background: points.leaderboard_opt_in ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: points.leaderboard_opt_in ? 'var(--bg-primary)' : 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>
          🏆 {points.leaderboard_opt_in ? 'On Leaderboard' : 'Join Leaderboard'}
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Earn points: Log session (+3) · Write review (+5) · AI chat (+1) · Finish a book (+10) · Max 19/day
      </p>
    </div>
  );
}