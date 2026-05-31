import React, { useRef, useState, useEffect } from 'react';
import { Download, BookOpen, Star, Clock, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';

export default function ProfileExport({ user }) {
  const cardRef = useRef(null);
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.email) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [lib, logs, reviews, prefs] = await Promise.all([
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.ReadingLog.filter({ user_email: user.email }),
        base44.entities.Review.filter({ user_email: user.email }),
        base44.entities.UserPreferences.filter({ user_email: user.email }),
      ]);
      const finished = lib.filter(b => b.status === 'finished');
      const totalMinutes = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
      const genres = {};
      lib.forEach(b => (b.book_categories || []).forEach(g => { genres[g] = (genres[g] || 0) + 1; }));
      const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);
      const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
      const p = prefs[0] || {};
      setData({ lib, finished, totalMinutes, topGenres, avgRating, totalLogs: logs.length, reviews: reviews.length, favoriteGenres: p.favorite_genres || [] });
    } catch (e) {}
  }

  async function exportImage() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lexio-profile.png';
      a.click();
    } catch (e) {}
    setExporting(false);
  }

  if (!data) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Profile Card</h3>
        <button onClick={exportImage} disabled={exporting} className="lx-btn-primary text-sm">
          <Download size={14} /> {exporting ? 'Exporting...' : 'Export as Image'}
        </button>
      </div>

      {/* Exportable card */}
      <div ref={cardRef} className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)', border: '1px solid var(--lx-accent)', maxWidth: '480px' }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center font-display text-2xl font-black"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {user?.full_name?.[0] || '?'}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Lexio Reader</p>
          </div>
          <div className="ml-auto text-3xl">📚</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: BookOpen, label: 'Books Finished', value: data.finished.length },
            { icon: Clock, label: 'Hours Read', value: Math.round(data.totalMinutes / 60) + 'h' },
            { icon: Star, label: 'Avg Rating', value: data.avgRating + ' ★' },
            { icon: TrendingUp, label: 'Reviews', value: data.reviews },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <Icon size={14} style={{ color: 'var(--lx-accent)', marginBottom: '4px' }} />
              <div className="font-display text-xl font-bold" style={{ color: 'var(--lx-accent)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Top genres */}
        {data.topGenres.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>TOP GENRES</p>
            <div className="flex flex-wrap gap-2">
              {data.topGenres.map(g => (
                <span key={g} className="text-xs px-2 py-1 rounded font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-accent)' }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Favorite genres from prefs */}
        {data.favoriteGenres.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>LOVES READING</p>
            <div className="flex flex-wrap gap-2">
              {data.favoriteGenres.slice(0, 5).map(g => (
                <span key={g} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Recent finished */}
        {data.finished.slice(0, 3).map(b => (
          <div key={b.id} className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--lx-accent)' }}>✓</span> {b.book_title}
          </div>
        ))}

        <div className="mt-5 pt-4 text-center text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--lx-border)' }}>
          LexioReading.App · My Reading Story
        </div>
      </div>
    </div>
  );
}