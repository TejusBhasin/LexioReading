import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, X, BookOpen, Users, Pencil, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function ClassesTab({ school, user }) {
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ class_name: '', subject: '', description: '', teacher_email: '', teacher_name: '', student_emails: [] });
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => { if (school?.id) load(); }, [school]);

  async function load() {
    setLoading(true);
    try {
      const cls = await base44.entities.SchoolClass.filter({ school_id: school.id }, '-created_date');
      setClasses(cls);
      const res = await base44.functions.invoke('manageSchoolClass', { action: 'get_members', school_id: school.id });
      setMembers(res.data?.members || []);
    } catch (e) {}
    setLoading(false);
  }

  async function saveClass() {
    if (!form.class_name.trim() || !form.teacher_email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await base44.functions.invoke('manageSchoolClass', {
          action: 'update', school_id: school.id, class_id: editing.id, class_data: form,
        });
        setClasses(prev => prev.map(c => c.id === editing.id ? res.data.class : c));
      } else {
        const res = await base44.functions.invoke('manageSchoolClass', {
          action: 'create', school_id: school.id, class_data: form,
        });
        setClasses(prev => [res.data.class, ...prev]);
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ class_name: '', subject: '', description: '', teacher_email: '', teacher_name: '', student_emails: [] });
    } catch (e) {}
    setSaving(false);
  }

  async function deleteClass(cls) {
    if (!confirm(`Delete "${cls.class_name}"? This cannot be undone.`)) return;
    try {
      await base44.functions.invoke('manageSchoolClass', { action: 'delete', school_id: school.id, class_id: cls.id });
      setClasses(prev => prev.filter(c => c.id !== cls.id));
    } catch (e) {}
  }

  function openEdit(cls) {
    setEditing(cls);
    setForm({
      class_name: cls.class_name || '',
      subject: cls.subject || '',
      description: cls.description || '',
      teacher_email: cls.teacher_email || '',
      teacher_name: cls.teacher_name || '',
      student_emails: cls.student_emails || [],
    });
    setShowCreate(true);
  }

  function openCreate() {
    setEditing(null);
    setForm({ class_name: '', subject: '', description: '', teacher_email: '', teacher_name: '', student_emails: [] });
    setShowCreate(true);
  }

  function toggleStudent(email) {
    setForm(f => ({
      ...f,
      student_emails: f.student_emails.includes(email)
        ? f.student_emails.filter(e => e !== email)
        : [...f.student_emails, email],
    }));
  }

  function setTeacher(email) {
    const member = members.find(m => m.user_email === email);
    setForm(f => ({ ...f, teacher_email: email, teacher_name: member?.username || email.split('@')[0] }));
  }

  const filteredMembers = members.filter(m =>
    !memberSearch || m.user_email.toLowerCase().includes(memberSearch.toLowerCase()) || (m.username || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{classes.length} class(es) · Group students and assign teachers</p>
        <button onClick={openCreate} className="lx-btn-primary text-sm">
          <Plus size={14} /> New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No classes yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create a class to group students and assign a teacher.</p>
          <button onClick={openCreate} className="lx-btn-primary text-sm">
            <Plus size={14} /> Create Your First Class
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <div key={cls.id} className="lx-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                  <BookOpen size={18} style={{ color: 'var(--lx-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/school/class/${cls.id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {cls.class_name}
                  </Link>
                  {cls.subject && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>· {cls.subject}</span>}
                  {cls.description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{cls.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {cls.student_emails?.length || 0} students</span>
                    <span>Teacher: {cls.teacher_name || cls.teacher_email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link to={`/school/class/${cls.id}`} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="View">
                    <ChevronRight size={16} />
                  </Link>
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteClass(cls)} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: '#f87171' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editing ? 'Edit Class' : 'New Class'}
              </h2>
              <button onClick={() => { setShowCreate(false); setEditing(null); }} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Class Name *</label>
                <input className="lx-input text-sm" placeholder="e.g. Period 1 - English 10"
                  value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Subject (optional)</label>
                <input className="lx-input text-sm" placeholder="e.g. English, History"
                  value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Description (optional)</label>
                <textarea className="lx-input text-sm resize-none" rows={2} placeholder="Brief description..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Teacher selection */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Teacher *</label>
                <select className="lx-input text-sm" value={form.teacher_email} onChange={e => setTeacher(e.target.value)}>
                  <option value="">Select a teacher...</option>
                  {members.map(m => (
                    <option key={m.user_email} value={m.user_email}>{m.username || m.user_email}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>The teacher can view class statistics. Only school members appear here.</p>
              </div>

              {/* Student selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Students ({form.student_emails.length} selected)</label>
                </div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input className="lx-input text-sm pl-9" placeholder="Search members..."
                    value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg p-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No members found</p>
                  ) : filteredMembers.map(m => {
                    const selected = form.student_emails.includes(m.user_email);
                    return (
                      <button key={m.user_email} onClick={() => toggleStudent(m.user_email)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all"
                        style={{ background: selected ? 'rgba(245,166,35,0.1)' : 'transparent', color: selected ? 'var(--lx-accent)' : 'var(--text-secondary)' }}>
                        <span className="truncate">{m.username || m.user_email}</span>
                        {selected && <span className="text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowCreate(false); setEditing(null); }} className="lx-btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={saveClass} disabled={!form.class_name.trim() || !form.teacher_email || saving}
                className="lx-btn-primary flex-1 justify-center">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}