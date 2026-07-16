import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Users, ChevronRight, GraduationCap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const cls = await base44.entities.SchoolClass.filter({ teacher_email: user.email }, '-created_date');
      setClasses(cls);
    } catch (e) {}
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate('/profile')} className="lx-btn-ghost text-sm mb-6 py-1.5 px-3">
        ← Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <GraduationCap size={20} style={{ color: 'var(--lx-accent)' }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Classes</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Classes where you're the assigned teacher</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No classes assigned</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When a school admin assigns you as a teacher, your classes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <Link key={cls.id} to={`/school/class/${cls.id}`}
              className="lx-card p-4 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                <BookOpen size={18} style={{ color: 'var(--lx-accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{cls.class_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Users size={11} /> {cls.student_emails?.length || 0} students</span>
                  {cls.subject && <span>· {cls.subject}</span>}
                  <span>· {cls.school_name}</span>
                </div>
              </div>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}