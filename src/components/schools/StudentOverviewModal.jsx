import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Clock, Star, Target, Zap, Settings, MessageSquare, Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function StudentOverviewModal({ schoolId, student, onClose }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOverview, setAiOverview] = useState('');
  const [loadingAiOverview, setLoadingAiOverview] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (schoolId && student?.user_email) {
      loadOverview();
      loadAiOverview();
    }
  }, [schoolId, student?.user_email]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiLoading]);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getStudentOverview', {
        school_id: schoolId,
        student_email: student.user_email,
      });
      setOverview(res.data);
    } catch (e) {}
    setLoading(false);
  }

  async function loadAiOverview() {
    setLoadingAiOverview(true);
    try {
      const res = await base44.functions.invoke('schoolAIChat', {
        school_id: schoolId,
        student_email: student.user_email,
        mode: 'overview',
      });
      setAiOverview(res.data?.answer || 'Unable to generate overview.');
    } catch (e) {
      setAiOverview('Unable to generate overview.');
    }
    setLoadingAiOverview(false);
  }

  async function sendQuestion() {
    if (!input.trim() || aiLoading) return;
    const q = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setAiLoading(true);
    try {
      const res = await base44.functions.invoke('schoolAIChat', {
        school_id: schoolId,
        student_email: student.user_email,
        question: q,
        mode: 'chat',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data?.answer || 'Sorry, I could not process that.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    }
    setAiLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-xl my-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--lx-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
              {(student.username || student.user_email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{student.username || student.user_email}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{student.user_email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded transition-all hover:opacity-70">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[calc(85vh-80px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : overview ? (
            <>
              {/* AI Overview */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} style={{ color: 'var(--lx-accent)' }} />
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Student Summary</h3>
                  </div>
                  <button onClick={loadAiOverview} disabled={loadingAiOverview} className="p-1 rounded transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={13} className={loadingAiOverview ? 'animate-spin' : ''} />
                  </button>
                </div>
                {loadingAiOverview ? (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyzing student data...</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed prose prose-sm" style={{ color: 'var(--text-secondary)' }}>
                    <ReactMarkdown>{aiOverview}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Data sections */}
              {overview.data.reading_logs && (
                <DataSection icon={Clock} title="Reading Sessions">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Stat label="Sessions" value={overview.data.reading_logs.sessions} />
                    <Stat label="Total Min" value={overview.data.reading_logs.total_minutes} />
                    <Stat label="Avg/Session" value={overview.data.reading_logs.sessions > 0 ? Math.round(overview.data.reading_logs.total_minutes / overview.data.reading_logs.sessions) + 'm' : '—'} />
                  </div>
                  {overview.data.reading_logs.recent.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Recent Sessions</p>
                      {overview.data.reading_logs.recent.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                          <BookOpen size={11} style={{ color: 'var(--lx-accent)' }} />
                          <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{l.book_title || 'Unknown'}</span>
                          {l.mood && <span style={{ color: 'var(--text-muted)' }}>{l.mood}</span>}
                          <span style={{ color: 'var(--text-muted)' }}>{l.time_spent || 0}m</span>
                          <span style={{ color: 'var(--text-muted)' }}>{l.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </DataSection>
              )}

              {overview.data.library && (
                <DataSection icon={BookOpen} title="Library">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <Stat label="Total" value={overview.data.library.total} />
                    <Stat label="Finished" value={overview.data.library.finished} />
                    <Stat label="Reading" value={overview.data.library.reading} />
                    <Stat label="Want" value={overview.data.library.want_to_read} />
                  </div>
                  {overview.data.library.recent.length > 0 && (
                    <div className="space-y-1">
                      {overview.data.library.recent.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                          {l.cover ? <img src={l.cover} alt="" className="w-6 h-8 object-cover rounded flex-shrink-0" /> : <BookOpen size={11} style={{ color: 'var(--text-muted)' }} />}
                          <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{l.title}</span>
                          <span className="text-xs px-1.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>{l.status}</span>
                          {l.rating && <Star size={10} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </DataSection>
              )}

              {overview.data.reviews && (
                <DataSection icon={Star} title="Reviews">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Total Reviews" value={overview.data.reviews.total} />
                    <Stat label="Avg Rating" value={overview.data.reviews.avg_rating ? overview.data.reviews.avg_rating + ' ★' : '—'} />
                  </div>
                  {overview.data.reviews.recent.length > 0 && (
                    <div className="space-y-1">
                      {overview.data.reviews.recent.map((r, i) => (
                        <div key={i} className="text-xs p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <Star size={10} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />
                            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{r.book_title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{r.date}</span>
                          </div>
                          {r.content && <p className="line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.content}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </DataSection>
              )}

              {overview.data.reading_goals && overview.data.reading_goals.length > 0 && (
                <DataSection icon={Target} title="Reading Goals">
                  {overview.data.reading_goals.map((g, i) => (
                    <div key={i} className="text-xs p-2 rounded flex items-center justify-between" style={{ background: 'var(--bg-elevated)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{g.year} Goal</span>
                      <span style={{ color: 'var(--lx-accent)' }}>{g.target_books} books{g.target_pages ? ` / ${g.target_pages} pages` : ''}</span>
                    </div>
                  ))}
                </DataSection>
              )}

              {overview.data.points_streaks && (
                <DataSection icon={Zap} title="Points & Streaks">
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Points" value={overview.data.points_streaks.total_points || 0} />
                    <Stat label="Streak" value={(overview.data.points_streaks.streak || 0) + ' days'} />
                    <Stat label="Freezes" value={overview.data.points_streaks.streak_freezes || 0} />
                  </div>
                </DataSection>
              )}

              {overview.data.preferences && (
                <DataSection icon={Settings} title="Preferences">
                  <div className="flex flex-wrap gap-1.5">
                    {overview.data.preferences.favorite_genres?.map(g => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{g}</span>
                    ))}
                    {overview.data.preferences.pacing && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Pacing: {overview.data.preferences.pacing}</span>
                    )}
                  </div>
                </DataSection>
              )}

              {overview.data.forum_activity && (
                <DataSection icon={MessageSquare} title="Forum Activity">
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Posts" value={overview.data.forum_activity.posts} />
                    <Stat label="Discussions" value={overview.data.forum_activity.discussions} />
                  </div>
                </DataSection>
              )}

              {/* AI Chat */}
              <div className="rounded-xl flex flex-col" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)', height: '300px' }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--lx-border)' }}>
                  <Bot size={14} style={{ color: 'var(--lx-accent)' }} />
                  <h3 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Ask AI about this student</h3>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.length === 0 && !aiLoading && (
                    <div className="text-center py-4">
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Ask about reading habits, engagement, or recommendations.</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['Reading habits summary', 'How can I help this student?', 'What genres do they prefer?'].map(s => (
                          <button key={s} onClick={() => setInput(s)}
                            className="text-xs px-2.5 py-1 rounded-full transition-all"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
                          <Bot size={10} style={{ color: 'var(--lx-accent)' }} />
                        </div>
                      )}
                      <div className="max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs"
                        style={{ background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-card)', color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                        {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
                          <User size={10} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
                        <Bot size={10} style={{ color: 'var(--lx-accent)' }} />
                      </div>
                      <div className="rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex gap-1">
                          {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--text-muted)', animationDelay: `${i*150}ms` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2.5 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                  <div className="flex gap-2">
                    <input className="lx-input text-xs flex-1" placeholder="Ask about this student..."
                      value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendQuestion()} disabled={aiLoading} />
                    <button onClick={sendQuestion} disabled={!input.trim() || aiLoading} className="lx-btn-primary px-2.5 py-1.5">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>Unable to load student data.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DataSection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} style={{ color: 'var(--lx-accent)' }} />
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
      <p className="font-bold text-sm" style={{ color: 'var(--lx-accent)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}