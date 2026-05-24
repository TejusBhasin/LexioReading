import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, BookOpen, PenLine, Plus, Calendar, TrendingUp, Flame, X, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

const MOODS = ['📖 Focused', '😌 Relaxed', '🌧️ Emotional', '⚡ Energized', '🤔 Reflective', '😴 Tired'];

export default function ReadingLogPage() {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [pendingLog, setPendingLog] = useState(null);
  const [form, setForm] = useState({ book_title: '', book_author: '', book_id: '', time_spent_minutes: '', progress_note: '', reflection: '', mood: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (user?.email) { loadData(); }
    else { setLoading(false); }
    return () => clearInterval(intervalRef.current);
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [logsData, libData] = await Promise.all([
        base44.entities.ReadingLog.filter({ user_email: user.email }, '-created_date', 50),
        base44.entities.UserLibrary.filter({ user_email: user.email, status: 'reading' }),
      ]);
      setLogs(logsData);
      setLibrary(libData);
      if (libData[0] && !selectedBook) {
        setSelectedBook(libData[0]);
        setForm(f => ({ ...f, book_title: libData[0].book_title, book_author: libData[0].book_author, book_id: libData[0].book_id }));
      }
    } catch (e) {}
    setLoading(false);
  }

  function startTimer() {
    setTimerRunning(true);
    setSessionStart(new Date());
    intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
  }

  function pauseTimer() {
    setTimerRunning(false);
    clearInterval(intervalRef.current);
  }

  function stopTimer() {
    clearInterval(intervalRef.current);
    setTimerRunning(false);
    const minutes = Math.ceil(timerSeconds / 60);
    setPendingLog({ minutes, sessionStart: sessionStart?.toISOString(), sessionEnd: new Date().toISOString() });
    setTimerSeconds(0);
    setShowReflection(true);
  }

  async function saveLog(withReflection = false) {
    if (!user) return;
    setSaving(true);
    const minutes = pendingLog?.minutes || parseInt(form.time_spent_minutes) || 0;
    try {
      const entry = await base44.entities.ReadingLog.create({
        user_email: user.email,
        book_id: form.book_id || selectedBook?.book_id,
        book_title: form.book_title || selectedBook?.book_title || 'Unknown',
        book_author: form.book_author || selectedBook?.book_author,
        book_cover: selectedBook?.book_cover,
        date: form.date,
        time_spent_minutes: minutes,
        progress_note: form.progress_note,
        reflection: withReflection ? form.reflection : '',
        mood: form.mood,
        session_started: pendingLog?.sessionStart,
        session_ended: pendingLog?.sessionEnd,
      });
      setLogs(prev => [entry, ...prev]);
      setPendingLog(null);
      setShowReflection(false);
      setShowLogForm(false);
      setForm(f => ({ ...f, time_spent_minutes: '', progress_note: '', reflection: '', mood: '' }));
    } catch (e) {}
    setSaving(false);
  }

  const totalMinutes = logs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const streakDays = computeStreak(logs);

  const formatTimer = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Clock size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Reading Log</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Track your reading sessions and reflections.</p>
        <Link to="/login" className="lx-btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={24} style={{ color: 'var(--lx-accent)' }} /> Reading Log
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track sessions, reflections {'&'} habits</p>
        </div>
        <button onClick={() => setShowLogForm(true)} className="lx-btn-primary text-sm">
          <Plus size={14} /> Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Sessions', value: logs.length, icon: BookOpen },
          { label: 'Hours Read', value: totalHours + 'h', icon: Clock },
          { label: 'Day Streak', value: streakDays + ' 🔥', icon: Flame },
          { label: 'This Month', value: logsThisMonth(logs), icon: Calendar },
        ].map(s => (
          <div key={s.label} className="lx-card p-4 flex flex-col gap-2">
            <s.icon size={15} style={{ color: 'var(--lx-accent)' }} />
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className="lx-card p-6 mb-8">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Play size={16} style={{ color: 'var(--lx-accent)' }} /> Session Timer
        </h2>

        {library.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Currently reading</label>
            <select
              className="lx-input"
              value={selectedBook?.id || ''}
              onChange={e => {
                const b = library.find(l => l.id === e.target.value);
                setSelectedBook(b);
                if (b) setForm(f => ({ ...f, book_title: b.book_title, book_author: b.book_author, book_id: b.book_id }));
              }}
            >
              {library.map(b => <option key={b.id} value={b.id}>{b.book_title}</option>)}
            </select>
          </div>
        )}

        <div className="text-center py-6">
          <div className="font-mono text-5xl font-bold mb-6 tracking-wider" style={{ color: 'var(--lx-accent)' }}>
            {formatTimer(timerSeconds)}
          </div>
          <div className="flex items-center justify-center gap-3">
            {!timerRunning ? (
              <button onClick={startTimer} className="lx-btn-primary px-8">
                <Play size={16} /> Start
              </button>
            ) : (
              <button onClick={pauseTimer} className="lx-btn-ghost px-8">
                <Pause size={16} /> Pause
              </button>
            )}
            {timerSeconds > 0 && (
              <button onClick={stopTimer} className="lx-btn-ghost px-6" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                <Square size={14} /> Stop {'&'} Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log History */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={16} style={{ color: 'var(--lx-accent)' }} /> History
        </h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="lx-card p-4 h-20 animate-pulse" />)}</div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map(log => <LogEntry key={log.id} log={log} />)}
          </div>
        ) : (
          <div className="lx-card p-8 text-center">
            <BookOpen size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No sessions logged yet. Start the timer!</p>
          </div>
        )}
      </div>

      {/* Reflection Modal (after timer stop) */}
      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Great session! {pendingLog?.minutes}m read 🎉
              </h2>
              <button onClick={() => { setShowReflection(false); setPendingLog(null); }}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Want to add a reflection?</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Progress note (optional)</label>
                <input className="lx-input text-sm" placeholder="Chapter reached, page, etc." value={form.progress_note} onChange={e => setForm(f => ({ ...f, progress_note: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, mood: m }))}
                      className="text-xs px-2.5 py-1 rounded transition-all"
                      style={{ background: form.mood === m ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: form.mood === m ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Reflection / Thoughts</label>
                <textarea className="lx-input resize-none text-sm" rows={4} placeholder="What did you feel? Quotes, predictions, reactions..." value={form.reflection} onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveLog(true)} disabled={saving} className="lx-btn-primary flex-1 justify-center text-sm">
                  <PenLine size={14} /> Save with Reflection
                </button>
                <button onClick={() => saveLog(false)} disabled={saving} className="lx-btn-ghost text-sm px-4">
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Log Form */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Log a Session</h2>
              <button onClick={() => setShowLogForm(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-3">
              {library.length > 0 && (
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Pick from library</label>
                  <select className="lx-input text-sm" value={selectedBook?.id || ''} onChange={e => {
                    const b = library.find(l => l.id === e.target.value);
                    setSelectedBook(b);
                    if (b) setForm(f => ({ ...f, book_title: b.book_title, book_author: b.book_author, book_id: b.book_id }));
                  }}>
                    <option value="">select book...</option>
                    {library.map(b => <option key={b.id} value={b.id}>{b.book_title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Book Title *</label>
                <input className="lx-input text-sm" value={form.book_title} onChange={e => setForm(f => ({ ...f, book_title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Date</label>
                <input type="date" className="lx-input text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Minutes read</label>
                <input type="number" className="lx-input text-sm" placeholder="e.g. 45" value={form.time_spent_minutes} onChange={e => setForm(f => ({ ...f, time_spent_minutes: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Progress note</label>
                <input className="lx-input text-sm" placeholder="Chapter, page number..." value={form.progress_note} onChange={e => setForm(f => ({ ...f, progress_note: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, mood: m }))}
                      className="text-xs px-2.5 py-1 rounded transition-all"
                      style={{ background: form.mood === m ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: form.mood === m ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Reflection</label>
                <textarea className="lx-input resize-none text-sm" rows={4} placeholder="Thoughts, quotes, emotions..." value={form.reflection} onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))} />
              </div>
              <button onClick={() => { setPendingLog({ minutes: parseInt(form.time_spent_minutes) || 0 }); saveLog(true); }} disabled={saving || !form.book_title} className="lx-btn-primary w-full justify-center text-sm">
                {saving ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="lx-card p-4">
      <div className="flex items-start gap-3">
        {log.book_cover ? (
          <img src={log.book_cover} alt={log.book_title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
            <BookOpen size={14} style={{ color: 'var(--lx-accent)' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {log.book_id ? (
                <Link to={`/book/${log.book_id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>{log.book_title}</Link>
              ) : (
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{log.book_title}</span>
              )}
              {log.book_author && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>by {log.book_author}</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {log.time_spent_minutes > 0 && (
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                  {log.time_spent_minutes}m
                </span>
              )}
              {log.reflection && (
                <button onClick={() => setExpanded(e => !e)}>
                  <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.date}</span>
            {log.mood && <span className="text-xs">{log.mood}</span>}
            {log.progress_note && <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{log.progress_note}</span>}
          </div>
          {expanded && log.reflection && (
            <div className="mt-3 p-3 rounded text-sm" style={{ background: 'var(--bg-elevated)', borderLeft: '2px solid var(--lx-accent)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>{log.reflection}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function computeStreak(logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.date).filter(Boolean))].sort().reverse();
  let streak = 0;
  let current = new Date().toISOString().slice(0, 10);
  for (const date of dates) {
    if (date === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = d.toISOString().slice(0, 10);
    } else break;
  }
  return streak;
}

function logsThisMonth(logs) {
  const month = new Date().toISOString().slice(0, 7);
  return logs.filter(l => l.date?.startsWith(month)).length;
}