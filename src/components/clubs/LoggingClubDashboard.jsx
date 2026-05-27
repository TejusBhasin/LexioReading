import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Users, BarChart2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="lx-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: 'var(--lx-accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      <p className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function LoggingClubDashboard({ club, members, isAdmin }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [club.id, members]);

  async function loadLogs() {
    setLoading(true);
    try {
      const memberEmails = (club.member_emails || []);
      if (memberEmails.length === 0) { setLoading(false); return; }
      // Fetch logs for all members
      const allLogs = await Promise.all(
        memberEmails.map(email => base44.entities.ReadingLog.filter({ user_email: email }))
      );
      setLogs(allLogs.flat());
    } catch (e) {}
    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <div className="lx-card p-8 text-center">
        <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Logging Club</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your reading logs are visible to the club admin. Keep logging!</p>
      </div>
    );
  }

  // Compute stats
  const totalSessions = logs.length;
  const totalMinutes = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
  const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const activeMembers = [...new Set(logs.map(l => l.user_email))].length;

  // Book frequency
  const bookCounts = {};
  logs.forEach(l => {
    if (l.book_title) bookCounts[l.book_title] = (bookCounts[l.book_title] || 0) + 1;
  });
  const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Per-member stats
  const memberStats = {};
  logs.forEach(l => {
    if (!memberStats[l.user_email]) memberStats[l.user_email] = { email: l.user_email, sessions: 0, minutes: 0, books: new Set() };
    memberStats[l.user_email].sessions++;
    memberStats[l.user_email].minutes += (l.time_spent_minutes || 0);
    if (l.book_title) memberStats[l.user_email].books.add(l.book_title);
  });
  const memberList = Object.values(memberStats).sort((a, b) => b.minutes - a.minutes);

  // Mood frequency
  const moodCounts = {};
  logs.forEach(l => { if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>📊 Club Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Sessions" value={totalSessions} icon={BarChart2} />
          <StatCard label="Total Minutes" value={totalMinutes} icon={Clock} />
          <StatCard label="Avg Session" value={`${avgMinutes}m`} icon={TrendingUp} sub="per session" />
          <StatCard label="Active Readers" value={activeMembers} icon={Users} sub={`of ${(club.member_emails || []).length} members`} />
        </div>
      </div>

      {/* Top Books */}
      {topBooks.length > 0 && (
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📚 Most Read Books</h3>
          <div className="space-y-2">
            {topBooks.map(([title, count], i) => (
              <div key={title} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <span className="font-display text-lg font-bold w-6 text-center" style={{ color: 'var(--lx-accent)' }}>#{i + 1}</span>
                <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>{count} session{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Breakdown */}
      {memberList.length > 0 && (
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>👤 Member Breakdown</h3>
          <div className="space-y-2">
            {memberList.map(m => (
              <div key={m.email} className="lx-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.email}</p>
                  <span className="text-xs" style={{ color: 'var(--lx-accent)' }}>{m.minutes}m total</span>
                </div>
                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{m.sessions} sessions</span>
                  <span>{m.books.size} book{m.books.size !== 1 ? 's' : ''}</span>
                  <span>avg {m.sessions > 0 ? Math.round(m.minutes / m.sessions) : 0}m/session</span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${memberList[0].minutes > 0 ? Math.round((m.minutes / memberList[0].minutes) * 100) : 0}%`,
                    background: 'var(--lx-accent)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reading Moods */}
      {topMoods.length > 0 && (
        <div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>😊 Common Reading Moods</h3>
          <div className="flex flex-wrap gap-2">
            {topMoods.map(([mood, count]) => (
              <div key={mood} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)', color: 'var(--text-secondary)' }}>
                {mood} <span className="font-bold" style={{ color: 'var(--lx-accent)' }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalSessions === 0 && (
        <div className="text-center py-12">
          <Clock size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>No logs yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Members' reading sessions will appear here as they log.</p>
        </div>
      )}
    </div>
  );
}