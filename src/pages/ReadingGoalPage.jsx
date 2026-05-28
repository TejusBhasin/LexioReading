import React, { useState, useEffect } from 'react';
import { Target, Check, BookOpen, TrendingUp, Edit2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function ReadingGoalPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [library, setLibrary] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ target_books: 12, target_pages: 0 });
  const [saving, setSaving] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user?.email) loadData();
  }, [user]);

  async function loadData() {
    const [goals, lib] = await Promise.all([
      base44.entities.ReadingGoal.filter({ user_email: user.email, year: currentYear }),
      base44.entities.UserLibrary.filter({ user_email: user.email, status: 'finished' }),
    ]);
    setLibrary(lib);
    if (goals[0]) {
      setGoal(goals[0]);
      setForm({ target_books: goals[0].target_books || 12, target_pages: goals[0].target_pages || 0 });
    } else {
      setEditing(true);
    }
  }

  async function save() {
    setSaving(true);
    const data = { ...form, user_email: user.email, year: currentYear };
    if (goal?.id) {
      await base44.entities.ReadingGoal.update(goal.id, data);
      setGoal({ ...goal, ...data });
    } else {
      const created = await base44.entities.ReadingGoal.create(data);
      setGoal(created);
    }
    setEditing(false);
    setSaving(false);
  }

  const finishedThisYear = library.filter(b => {
    const d = b.date_finished || b.updated_date;
    return d && new Date(d).getFullYear() === currentYear;
  });

  const bookProgress = goal ? Math.min(100, Math.round((finishedThisYear.length / (goal.target_books || 1)) * 100)) : 0;
  const onTrack = finishedThisYear.length >= Math.floor((new Date().getMonth() + 1) / 12 * (goal?.target_books || 12));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Target size={22} style={{ color: 'var(--lx-accent)' }} /> {currentYear} Reading Goal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Set your annual reading target and track progress</p>
        </div>
        {goal && !editing && (
          <button onClick={() => setEditing(true)} className="lx-btn-ghost text-sm py-1.5">
            <Edit2 size={13} /> Edit
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="lx-card p-6 mb-6 space-y-4">
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Set Your Goal</h3>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Books to read in {currentYear}</label>
            <input type="number" min={1} max={365} className="lx-input text-sm"
              value={form.target_books} onChange={e => setForm(f => ({ ...f, target_books: parseInt(e.target.value) || 1 }))} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Total pages goal (optional)</label>
            <input type="number" min={0} className="lx-input text-sm"
              placeholder="e.g. 10000" value={form.target_pages || ''} onChange={e => setForm(f => ({ ...f, target_pages: parseInt(e.target.value) || 0 }))} />
          </div>
          <button onClick={save} disabled={saving} className="lx-btn-primary text-sm">
            {saving ? 'Saving...' : <><Check size={13} /> Save Goal</>}
          </button>
        </div>
      )}

      {/* Progress */}
      {goal && !editing && (
        <div className="space-y-5">
          {/* Main ring */}
          <div className="lx-card p-6 flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lx-border)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lx-accent)" strokeWidth="10"
                  strokeDasharray={`${bookProgress * 2.513} 251.3`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg" style={{ color: 'var(--lx-accent)' }}>
                {bookProgress}%
              </div>
            </div>
            <div>
              <p className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {finishedThisYear.length} <span className="text-lg font-normal" style={{ color: 'var(--text-muted)' }}>/ {goal.target_books}</span>
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>books finished this year</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded" style={{
                background: onTrack ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)',
                color: onTrack ? '#10b981' : '#f97316'
              }}>
                {onTrack ? '✓ On track!' : '⚡ Pick up the pace'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Remaining', value: Math.max(0, goal.target_books - finishedThisYear.length) },
              { label: 'Books/month needed', value: ((Math.max(0, goal.target_books - finishedThisYear.length)) / Math.max(1, 12 - new Date().getMonth())).toFixed(1) },
              { label: 'Months left', value: 12 - new Date().getMonth() },
            ].map(s => (
              <div key={s.label} className="lx-card p-4 text-center">
                <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent finished */}
          {finishedThisYear.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BookOpen size={15} style={{ color: 'var(--lx-accent)' }} /> Finished This Year
              </h3>
              <div className="space-y-2">
                {finishedThisYear.slice(0, 8).map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                    {b.book_cover ? <img src={b.book_cover} className="w-8 h-11 object-cover rounded flex-shrink-0" /> : <div className="w-8 h-11 rounded flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.book_title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.book_author}</p>
                    </div>
                    <Check size={14} className="flex-shrink-0 ml-auto" style={{ color: '#10b981' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!goal && !editing && (
        <div className="lx-card p-10 text-center">
          <Target size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>No goal set for {currentYear} yet</p>
          <button onClick={() => setEditing(true)} className="lx-btn-primary text-sm">Set a Goal</button>
        </div>
      )}
    </div>
  );
}