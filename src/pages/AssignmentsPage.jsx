import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, Calendar, BookOpen, Check, Zap, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPE_LABELS = { any_book: 'Any Book', genre: 'Specific Genre', lexile: 'Lexile Range', specific_book: 'Specific Book' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);
  const [bookInputs, setBookInputs] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('manageAssignments', { action: 'get_student_assignments' });
      setAssignments(res.data?.assignments || []);
    } catch (e) {}
    setLoading(false);
  }

  async function markDone(id, bookTitle) {
    setMarking(id);
    try {
      await base44.functions.invoke('manageAssignments', { action: 'mark_done', assignment_id: id, book_title: bookTitle || '' });
      load();
    } catch (e) {}
    setMarking(null);
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const pending = assignments.filter(a => !a.submission || a.submission.status === 'pending');
  const completed = assignments.filter(a => a.submission && (a.submission.status === 'completed' || a.submission.status === 'auto_completed'));
  const overdue = pending.filter(a => a.due_date && new Date(a.due_date) < new Date());
  const active = pending.filter(a => !a.due_date || new Date(a.due_date) >= new Date());

  if (assignments.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <ClipboardList size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No Assignments</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When your teacher creates assignments, they'll appear here.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--lx-accent)' }}>
          <ClipboardList size={20} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assignments</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pending.length} pending · {completed.length} completed</p>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#f87171' }}><AlertCircle size={12} /> OVERDUE</h2>
          <div className="space-y-2">
            {overdue.map(a => <AssignmentCard key={a.id} a={a} overdue onMarkDone={markDone} marking={marking} bookInputs={bookInputs} setBookInputs={setBookInputs} />)}
          </div>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold mb-2" style={{ color: 'var(--lx-accent)' }}>PENDING</h2>
          <div className="space-y-2">
            {active.map(a => <AssignmentCard key={a.id} a={a} onMarkDone={markDone} marking={marking} bookInputs={bookInputs} setBookInputs={setBookInputs} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-bold mb-2" style={{ color: '#10b981' }}>COMPLETED</h2>
          <div className="space-y-2">
            {completed.map(a => <AssignmentCard key={a.id} a={a} done onMarkDone={markDone} marking={marking} bookInputs={bookInputs} setBookInputs={setBookInputs} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ a, done, overdue, onMarkDone, marking, bookInputs, setBookInputs }) {
  const sub = a.submission;
  const isDone = sub && (sub.status === 'completed' || sub.status === 'auto_completed');
  const needsBookTitle = a.assignment_type === 'any_book' || a.assignment_type === 'genre' || a.assignment_type === 'lexile';

  return (
    <div className="rounded-xl p-4" style={{
      background: 'var(--bg-card)',
      border: `1px solid ${overdue ? 'rgba(248,113,113,0.4)' : done ? 'rgba(16,185,129,0.3)' : 'var(--lx-border)'}`,
      opacity: done ? 0.7 : 1,
    }}>
      <div className="flex items-start gap-3">
        {a.target_book_cover && <img src={a.target_book_cover} alt="" className="w-10 h-14 object-cover rounded flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
            {isDone && (
              <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: sub?.auto_completed ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', color: sub?.auto_completed ? '#818cf8' : '#10b981' }}>
                {sub?.auto_completed ? <><Zap size={9} /> Auto</> : <><Check size={9} /> Done</>}
              </span>
            )}
          </div>
          {a.description && <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{TYPE_LABELS[a.assignment_type]}</span>
            {a.target_book_title && !a.target_book_cover && <span className="px-1.5 py-0.5 rounded truncate max-w-[120px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>📖 {a.target_book_title}</span>}
            {a.target_genre && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{a.target_genre}</span>}
            {a.target_lexile_min && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Lexile {a.target_lexile_min}-{a.target_lexile_max || '+'}</span>}
            {a.time_requirement_minutes && <span className="px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}><Clock size={9} />{a.time_requirement_minutes}m</span>}
            {a.due_date && <span className="px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: overdue ? 'rgba(248,113,113,0.15)' : 'var(--bg-elevated)', color: overdue ? '#f87171' : 'var(--text-secondary)' }}><Calendar size={9} />{new Date(a.due_date).toLocaleDateString()}</span>}
          </div>
          {a.class_name && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>📚 {a.class_name}</p>}
        </div>
      </div>

      {/* Mark done */}
      {!isDone && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--lx-border)' }}>
          {needsBookTitle && (
            <input className="lx-input text-sm mb-2" placeholder="What book did you read?" value={bookInputs[a.id] || ''} onChange={e => setBookInputs(prev => ({ ...prev, [a.id]: e.target.value }))} />
          )}
          <button onClick={() => onMarkDone(a.id, bookInputs[a.id])} disabled={marking === a.id} className="lx-btn-primary text-sm w-full justify-center">
            {marking === a.id ? 'Marking...' : <><Check size={13} /> Mark as Done</>}
          </button>
        </div>
      )}
      {isDone && sub?.submitted_book_title && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>📖 Read: {sub.submitted_book_title}</p>
      )}
    </div>
  );
}