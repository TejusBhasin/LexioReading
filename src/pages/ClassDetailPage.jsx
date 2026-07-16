import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Clock, Star, TrendingUp, Bot, GraduationCap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import SchoolAIChat from '@/components/schools/SchoolAIChat';

export default function ClassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageSchoolClass', {
        action: 'get_class_stats',
        class_id: id,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setData(res.data);
    } catch (e) {
      setError(e?.message || 'Failed to load class data.');
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <p className="mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
      <button onClick={() => navigate('/school-admin')} className="lx-btn-ghost text-sm">← Back to Admin</button>
    </div>
  );

  if (!data) return null;

  const cls = data.class;
  const stats = data.aggregate;
  const students = data.studentStats || [];
  const topBooks = data.topBooks || [];
  const canUseAI = data.canUseAI;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="lx-btn-ghost text-sm mb-6 py-1.5 px-3">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <BookOpen size={22} style={{ color: 'var(--lx-accent)' }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{cls.class_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {cls.subject && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{cls.subject}</span>}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Teacher: {cls.teacher_name || cls.teacher_email}</span>
          </div>
        </div>
      </div>

      {cls.description && (
        <p className="text-sm mb-6 p-3 rounded-lg" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          {cls.description}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Students', value: stats.totalStudents, icon: Users },
          { label: 'Reading Sessions', value: stats.totalSessions, icon: TrendingUp },
          { label: 'Total Minutes', value: stats.totalMinutes, icon: Clock },
          { label: 'Books Finished', value: stats.totalBooksFinished, icon: BookOpen },
        ].map(s => (
          <div key={s.label} className="lx-card p-4 text-center">
            <s.icon size={16} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users size={18} style={{ color: 'var(--lx-accent)' }} /> Student Statistics
        </h2>
        {students.length === 0 ? (
          <div className="lx-card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No students in this class yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.email} className="lx-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                      {(s.username || s.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.username || s.email}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                    </div>
                  </div>
                  {s.lastActivity ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last active: {new Date(s.lastActivity).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>No activity</span>
                  )}
                </div>
                <div className="flex gap-4 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                  <span>{s.sessions} sessions</span>
                  <span>{s.totalMinutes} min read</span>
                  <span>{s.booksFinished} finished</span>
                  <span>{s.booksReading} reading</span>
                  {s.reviews > 0 && <span>{s.reviews} reviews</span>}
                  {s.avgRating && <span className="flex items-center gap-0.5"><Star size={10} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />{s.avgRating}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Books */}
      {topBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={18} style={{ color: 'var(--lx-accent)' }} /> Popular Books
          </h2>
          <div className="space-y-2">
            {topBooks.map((b, i) => (
              <div key={i} className="lx-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{b.title}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--lx-accent)' }}>{b.sessions} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat (admin/semi_admin only) */}
      {canUseAI ? (
        <div>
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bot size={18} style={{ color: 'var(--lx-accent)' }} /> AI Analytics Assistant
          </h2>
          <SchoolAIChat schoolId={cls.school_id} classId={cls.id} scopeLabel={cls.class_name} />
        </div>
      ) : (
        <div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <GraduationCap size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI analytics is available to school admins and sub-admins.</p>
        </div>
      )}
    </div>
  );
}