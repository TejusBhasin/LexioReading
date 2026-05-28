import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, BookOpen, Flame, Target, Star, BarChart2, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function ScoreRing({ score, size = 140, label, color = 'var(--lx-accent)' }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--lx-border)" strokeWidth="10" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold" style={{ fontSize: size * 0.22, color }}>{score}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}

const SCORE_LABELS = [
  { min: 0, label: 'Just Starting', emoji: '📖' },
  { min: 20, label: 'Casual Reader', emoji: '🌱' },
  { min: 40, label: 'Book Lover', emoji: '📚' },
  { min: 60, label: 'Avid Reader', emoji: '🔥' },
  { min: 75, label: 'Literary Athlete', emoji: '⚡' },
  { min: 88, label: 'Reading Machine', emoji: '🏆' },
];

export default function ReadingStrengthPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.email) loadAll(); }, [user]);

  async function loadAll() {
    setLoading(true);
    const [library, logs, points, reviews] = await Promise.all([
      base44.entities.UserLibrary.filter({ user_email: user.email }),
      base44.entities.ReadingLog.filter({ user_email: user.email }, '-date', 200),
      base44.entities.UserPoints.filter({ user_email: user.email }),
      base44.entities.Review.filter({ user_email: user.email }),
    ]);

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const finished = library.filter(b => b.status === 'finished');
    const finishedThisYear = finished.filter(b => {
      const d = b.date_finished || b.updated_date;
      return d && new Date(d).getFullYear() === thisYear;
    });

    // Reading over last 8 weeks
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 * (7 - i)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const mins = logs
        .filter(l => { const d = new Date(l.date); return d >= weekStart && d < weekEnd; })
        .reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0);
      return { week: `W${i + 1}`, minutes: mins, hours: Math.round(mins / 60 * 10) / 10 };
    });

    // Genre distribution
    const genreMap = {};
    library.forEach(b => {
      const cats = b.tags || [];
      cats.forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1; });
    });
    // Also count by book_author patterns if no tags — use status groups as fallback
    const genreData = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

    // Monthly logs for last 6 months
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const booksFinished = finished.filter(b => {
        const fd = new Date(b.date_finished || b.updated_date);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      }).length;
      const minsLogged = logs.filter(l => {
        const ld = new Date(l.date);
        return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
      }).reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
      return { month: label, books: booksFinished, hours: Math.round(minsLogged / 60 * 10) / 10 };
    });

    // Scores
    const streak = points[0]?.streak_days || 0;
    const totalBooks = finished.length;
    const totalLogs = logs.length;
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;
    const logsThisMonth = logs.filter(l => { const d = new Date(l.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).length;
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();

    const consistencyScore = Math.min(100, Math.round((logsThisMonth / Math.max(daysInMonth, 1)) * 2.5 * 100));
    const volumeScore = Math.min(100, Math.round(Math.min(finishedThisYear.length / 24, 1) * 100));
    const streakScore = Math.min(100, Math.round(Math.min(streak / 30, 1) * 100));
    const engagementScore = Math.min(100, Math.round(Math.min(reviews.length / 20, 1) * 100));
    const overallScore = Math.round((consistencyScore * 0.35) + (volumeScore * 0.30) + (streakScore * 0.25) + (engagementScore * 0.10));

    const radarData = [
      { subject: 'Consistency', A: consistencyScore },
      { subject: 'Volume', A: volumeScore },
      { subject: 'Streak', A: streakScore },
      { subject: 'Engagement', A: engagementScore },
      { subject: 'Diversity', A: Math.min(100, genreData.length * 14) },
    ];

    setData({ overallScore, consistencyScore, volumeScore, streakScore, engagementScore, weeklyData, monthlyData, genreData, radarData, finishedThisYear, streak, totalBooks, totalLogs, avgRating });
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const scoreInfo = SCORE_LABELS.slice().reverse().find(s => data.overallScore >= s.min) || SCORE_LABELS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={22} style={{ color: 'var(--lx-accent)' }} /> Reading Strength
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal reading fitness dashboard</p>
      </div>

      {/* Main Score */}
      <div className="lx-card p-6 mb-5 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={data.overallScore} size={150} />
        <div className="flex-1 text-center md:text-left">
          <div className="text-4xl mb-1">{scoreInfo.emoji}</div>
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{scoreInfo.label}</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your reading strength score is based on consistency, volume, streaks, and engagement.</p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            {[
              { label: 'Books Finished', value: data.totalBooks },
              { label: 'Day Streak', value: data.streak },
              { label: 'Sessions Logged', value: data.totalLogs },
            ].map(s => (
              <div key={s.label} className="px-3 py-1.5 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                <div className="font-display font-bold text-lg" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Consistency', score: data.consistencyScore, color: '#6366f1' },
          { label: 'Volume', score: data.volumeScore, color: '#f97316' },
          { label: 'Streak', score: data.streakScore, color: '#ef4444' },
          { label: 'Engagement', score: data.engagementScore, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="lx-card p-4 flex flex-col items-center">
            <ScoreRing score={s.score} size={80} color={s.color} />
            <span className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Weekly reading hours */}
        <div className="lx-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <Activity size={14} style={{ color: 'var(--lx-accent)' }} /> Reading Activity (8 weeks)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.weeklyData}>
              <defs>
                <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--lx-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--lx-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                formatter={(v) => [`${v} hrs`, 'Reading']} />
              <Area type="monotone" dataKey="hours" stroke="var(--lx-accent)" fill="url(#readGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="lx-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <BarChart2 size={14} style={{ color: 'var(--lx-accent)' }} /> Strength Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={data.radarData}>
              <PolarGrid stroke="var(--lx-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar dataKey="A" stroke="var(--lx-accent)" fill="var(--lx-accent)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly books */}
      <div className="lx-card p-5 mb-5">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
          <BookOpen size={14} style={{ color: 'var(--lx-accent)' }} /> Books Finished per Month
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.monthlyData}>
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', borderRadius: 8, color: 'var(--text-primary)' }}
              formatter={(v) => [v, 'Books']} />
            <Bar dataKey="books" radius={[4, 4, 0, 0]}>
              {data.monthlyData.map((_, i) => (
                <Cell key={i} fill={i === data.monthlyData.length - 1 ? 'var(--lx-accent)' : 'var(--bg-elevated)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Genre breakdown */}
      {data.genreData.length > 0 && (
        <div className="lx-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <Star size={14} style={{ color: 'var(--lx-accent)' }} /> Reading Genres
          </h3>
          <div className="space-y-2">
            {data.genreData.map((g, i) => {
              const max = data.genreData[0]?.value || 1;
              return (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-xs w-24 truncate flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{g.name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(g.value / max) * 100}%`, background: 'var(--lx-accent)', opacity: 1 - i * 0.1 }} />
                  </div>
                  <span className="text-xs w-6 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{g.value}</span>
                </div>
              );
            })}
          </div>
          {data.genreData.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Add tags to your library books to see genre breakdown</p>
          )}
        </div>
      )}
    </div>
  );
}