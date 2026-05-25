import React, { useState, useRef, useEffect } from 'react';
import { Download, Star, BookOpen, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';

export default function ProfileExport({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (user?.email) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const [lib, logs, reviews, prefs, points] = await Promise.all([
      base44.entities.UserLibrary.filter({ user_email: user.email }),
      base44.entities.ReadingLog.filter({ user_email: user.email }).catch(() => []),
      base44.entities.Review.filter({ user_email: user.email }).catch(() => []),
      base44.entities.UserPreferences.filter({ user_email: user.email }).catch(() => []),
      base44.entities.UserPoints.filter({ user_email: user.email }).catch(() => []),
    ]);
    const finished = lib.filter(b => b.status === 'finished');
    const totalMins = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
    const genres = {};
    lib.forEach(b => (b.book_categories || []).forEach(g => { genres[g] = (genres[g] || 0) + 1; }));
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
    setData({
      finished: finished.length,
      reading: lib.filter(b => b.status === 'reading').length,
      totalMins,
      avgRating,
      topGenres,
      totalPoints: points[0]?.total_points || 0,
      streak: points[0]?.streak_days || 0,
      favoriteGenres: prefs[0]?.favorite_genres?.slice(0, 3) || [],
      recentBooks: finished.slice(0, 4),
    });
    setLoading(false);
  }

  async function exportImage() {
    if (!cardRef.current) return;
    setExporting(true);
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexio-profile.png';
    a.click();
    setExporting(false);
  }

  if (loading) return <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Card</h3>
        <button onClick={exportImage} disabled={exporting} className="lx-btn-primary text-sm">
          <Download size={14} /> {exporting ? 'Exporting...' : 'Download PNG'}
        </button>
      </div>

      {/* The exportable card */}
      <div ref={cardRef} className="rounded-2xl p-8 max-w-sm mx-auto"
        style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)', border: '1px solid var(--lx-border)' }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl font-black flex-shrink-0"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {user?.full_name?.[0] || '?'}
          </div>
          <div>
            <p className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name || 'Reader'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--lx-accent)' }}>Lexio Reader</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: BookOpen, value: data.finished, label: 'Books' },
            { icon: Clock, value: Math.round(data.totalMins / 60) + 'h', label: 'Read' },
            { icon: Zap, value: data.totalPoints, label: 'Points' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
              <s.icon size={14} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
              <div className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top genres */}
        {data.topGenres.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Favorite Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topGenres.map(g => (
                <span key={g} className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Recent books */}
        {data.recentBooks.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Recently Finished</p>
            <div className="flex gap-2">
              {data.recentBooks.map(b => b.book_cover ? (
                <img key={b.id} src={b.book_cover} alt={b.book_title} className="w-10 h-14 object-cover rounded" />
              ) : (
                <div key={b.id} className="w-10 h-14 rounded flex items-center justify-center text-xs font-bold p-1 text-center leading-tight"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', fontSize: '9px' }}>
                  {b.book_title.slice(0, 15)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>{data.streak} day streak</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Keep reading!</p>
            </div>
          </div>
          {data.avgRating && (
            <div className="flex items-center gap-1">
              <Star size={13} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{data.avgRating}</span>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>lexio.app</p>
      </div>
    </div>
  );
}