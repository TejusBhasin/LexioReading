import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Clock, Calendar, Users, Check, Search, BookOpen, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchBooks } from '@/lib/googleBooks';
import { GENRE_OPTIONS } from '@/lib/theme';

const TYPE_LABELS = { any_book: 'Any Book', genre: 'Specific Genre', lexile: 'Lexile Range', specific_book: 'Specific Book' };

export default function AssignmentManager({ cls, students }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [enabled, setEnabled] = useState(cls?.enable_assignments || false);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', assignment_type: 'any_book', target_genre: '',
    target_lexile_min: '', target_lexile_max: '', target_book_id: '', target_book_title: '',
    target_book_author: '', target_book_cover: '', time_requirement_minutes: '', due_date: '',
    assigned_student_emails: [],
  });

  useEffect(() => { if (cls?.id) load(); }, [cls]);
  useEffect(() => { setEnabled(cls?.enable_assignments || false); }, [cls]);

  async function load() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('manageAssignments', { action: 'get_class_assignments', class_id: cls.id });
      setAssignments(res.data?.assignments || []);
      setSubmissions(res.data?.submissions || []);
    } catch (e) {}
    setLoading(false);
  }

  async function toggleEnabled() {
    setToggling(true);
    try {
      await base44.functions.invoke('manageAssignments', { action: 'toggle_assignments', class_id: cls.id, enabled: !enabled });
      setEnabled(!enabled);
    } catch (e) {}
    setToggling(false);
  }

  async function searchForBooks() {
    if (!bookQuery.trim()) return;
    setSearchingBooks(true);
    try { setBookResults(await searchBooks(bookQuery, 6)); } catch (e) {}
    setSearchingBooks(false);
  }

  function selectBook(book) {
    setForm(f => ({ ...f, target_book_id: book.google_books_id, target_book_title: book.title, target_book_author: book.author, target_book_cover: book.cover_image }));
    setBookResults([]); setBookQuery('');
  }

  function toggleStudent(email) {
    setForm(f => ({ ...f, assigned_student_emails: f.assigned_student_emails.includes(email) ? f.assigned_student_emails.filter(e => e !== email) : [...f.assigned_student_emails, email] }));
  }

  async function createAssignment() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await base44.functions.invoke('manageAssignments', {
        action: 'create', class_id: cls.id,
        assignment_data: {
          ...form,
          time_requirement_minutes: form.time_requirement_minutes ? Number(form.time_requirement_minutes) : null,
          target_lexile_min: form.target_lexile_min ? Number(form.target_lexile_min) : null,
          target_lexile_max: form.target_lexile_max ? Number(form.target_lexile_max) : null,
        },
      });
      setShowCreate(false);
      setForm({ title: '', description: '', assignment_type: 'any_book', target_genre: '', target_lexile_min: '', target_lexile_max: '', target_book_id: '', target_book_title: '', target_book_author: '', target_book_cover: '', time_requirement_minutes: '', due_date: '', assigned_student_emails: [] });
      load();
    } catch (e) {}
    setSaving(false);
  }

  async function deleteAssignment(id) {
    if (!confirm('Delete this assignment?')) return;
    try { await base44.functions.invoke('manageAssignments', { action: 'delete', assignment_id: id }); load(); } catch (e) {}
  }

  function getStats(aid) {
    const subs = submissions.filter(s => s.assignment_id === aid);
    const completed = subs.filter(s => s.status === 'completed' || s.status === 'auto_completed').length;
    return { completed, total: students.length };
  }

  return (
    <div>
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ClipboardList size={16} style={{ color: 'var(--lx-accent)' }} /> Assignments Tab
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{enabled ? 'Students can see and complete assignments.' : 'Enable to let students see assignments in their app.'}</p>
        </div>
        <button onClick={toggleEnabled} disabled={toggling} className="w-11 h-6 rounded-full transition-all relative flex-shrink-0" style={{ background: enabled ? 'var(--lx-accent)' : 'var(--border-strong)' }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: enabled ? '22px' : '2px' }} />
        </button>
      </div>

      {/* Create button */}
      <button onClick={() => setShowCreate(!showCreate)} className="lx-btn-primary text-sm mb-4">
        <Plus size={14} /> Create Assignment
      </button>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
          <input className="lx-input text-sm" placeholder="Assignment title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="lx-input text-sm resize-none" rows={2} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          {/* Type selector */}
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Assignment Type</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, assignment_type: val }))}
                  className="px-3 py-2 rounded text-sm transition-all"
                  style={{ background: form.assignment_type === val ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: form.assignment_type === val ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${form.assignment_type === val ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {form.assignment_type === 'genre' && (
            <select className="lx-input text-sm" value={form.target_genre} onChange={e => setForm(f => ({ ...f, target_genre: e.target.value }))}>
              <option value="">Select genre...</option>
              {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          {form.assignment_type === 'lexile' && (
            <div className="flex gap-2">
              <input type="number" className="lx-input text-sm" placeholder="Min Lexile" value={form.target_lexile_min} onChange={e => setForm(f => ({ ...f, target_lexile_min: e.target.value }))} />
              <input type="number" className="lx-input text-sm" placeholder="Max Lexile" value={form.target_lexile_max} onChange={e => setForm(f => ({ ...f, target_lexile_max: e.target.value }))} />
            </div>
          )}
          {form.assignment_type === 'specific_book' && (
            <div>
              {form.target_book_title ? (
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  {form.target_book_cover && <img src={form.target_book_cover} alt="" className="w-8 h-12 object-cover rounded" />}
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{form.target_book_title}</span>
                  <button onClick={() => setForm(f => ({ ...f, target_book_id: '', target_book_title: '', target_book_author: '', target_book_cover: '' }))}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input className="lx-input text-sm flex-1" placeholder="Search for a book..." value={bookQuery} onChange={e => setBookQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchForBooks()} />
                  <button onClick={searchForBooks} disabled={searchingBooks} className="lx-btn-ghost text-sm"><Search size={14} /></button>
                </div>
              )}
              {bookResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {bookResults.map(b => (
                    <button key={b.google_books_id} onClick={() => selectBook(b)} className="w-full flex items-center gap-2 p-2 rounded text-left transition-all" style={{ background: 'var(--bg-elevated)' }}>
                      {b.cover_image && <img src={b.cover_image} alt="" className="w-6 h-9 object-cover rounded" />}
                      <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{b.title} — {b.author}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Time + Due date */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Reading time (min)</label>
              <input type="number" className="lx-input text-sm" placeholder="e.g. 30" value={form.time_requirement_minutes} onChange={e => setForm(f => ({ ...f, time_requirement_minutes: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Due date</label>
              <input type="date" className="lx-input text-sm" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          {/* Student selector */}
          {students.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Assign to {form.assigned_student_emails.length === 0 ? 'Whole Class' : `${form.assigned_student_emails.length} students`}
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {students.map(s => {
                  const sel = form.assigned_student_emails.includes(s.email);
                  return (
                    <button key={s.email} onClick={() => toggleStudent(s.email)}
                      className="text-xs px-2.5 py-1 rounded transition-all"
                      style={{ background: sel ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: sel ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${sel ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                      {sel && <Check size={10} className="inline mr-1" />}{s.username || s.email.split('@')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)} className="lx-btn-ghost text-sm flex-1 justify-center">Cancel</button>
            <button onClick={createAssignment} disabled={saving || !form.title.trim()} className="lx-btn-primary text-sm flex-1 justify-center">
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>
      )}

      {/* Assignment list */}
      {loading ? (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const stats = getStats(a.id);
            const isIndividual = a.assigned_student_emails?.length > 0;
            return (
              <div key={a.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    {a.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}
                  </div>
                  <button onClick={() => deleteAssignment(a.id)} className="p-1.5 rounded ml-2" style={{ background: 'rgba(248,113,113,0.1)' }}><Trash2 size={13} style={{ color: '#f87171' }} /></button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{TYPE_LABELS[a.assignment_type]}</span>
                  {a.target_book_title && <span className="px-2 py-0.5 rounded truncate max-w-[150px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>📖 {a.target_book_title}</span>}
                  {a.target_genre && <span className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{a.target_genre}</span>}
                  {a.time_requirement_minutes && <span className="px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}><Clock size={10} />{a.time_requirement_minutes}m</span>}
                  {a.due_date && <span className="px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}><Calendar size={10} />{new Date(a.due_date).toLocaleDateString()}</span>}
                  {isIndividual && <span className="px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}><Users size={10} />{a.assigned_student_emails.length} students</span>}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`, background: 'var(--lx-accent)' }} />
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{stats.completed}/{stats.total} done</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}