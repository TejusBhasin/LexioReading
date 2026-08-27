import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatSessionList from '@/components/chat/ChatSessionList';
function uuidv4() {
  return 'chat-' + Math.random().toString(36).slice(2) + '-' + Date.now();
}

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadSessions();
    }
  }, [user]);

  async function loadSessions() {
    setLoading(true);
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { user_email: user.email },
        '-created_date',
        200
      );
      // Group by session
      const sessMap = {};
      msgs.forEach(m => {
        const sid = m.session_id || 'default';
        if (!sessMap[sid]) {
          sessMap[sid] = {
            id: sid,
            title: m.session_title || 'Chat Session',
            lastMessage: m.content,
            date: m.created_date,
            messages: []
          };
        }
        sessMap[sid].messages.push(m);
      });
      const sessionList = Object.values(sessMap).sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(sessionList);
      if (sessionList.length > 0 && !activeSession) {
        setActiveSession(sessionList[0].id);
      }
    } catch (e) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(sid, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    const msgs = await base44.entities.ChatMessage.filter({ user_email: user.email, session_id: sid });
    await Promise.all(msgs.map(m => base44.entities.ChatMessage.delete(m.id)));
    setSessions(prev => prev.filter(s => s.id !== sid));
    if (activeSession === sid) setActiveSession(null);
  }

  function newChat() {
    const newId = uuidv4();
    setActiveSession(newId);
    // Don't add to sessions list yet — it appears after first message is sent & named
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <Sparkles size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          AI Chat
        </h2>
        <p className="mb-4 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Ask anything about books or movies. Get personalized recommendations through natural conversation.
        </p>
        <div className="max-w-2xl mx-auto mb-8 rounded-lg overflow-hidden" style={{ border: '1px solid var(--lx-border)' }}>
          <ChatInterface user={null} />
        </div>
        <Link to="/signup" className="lx-btn-primary">
          Sign Up for Full Access
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex min-h-0">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ borderColor: 'var(--lx-border)', background: 'var(--bg-secondary)' }}
      >
        <ChatSessionList
          sessions={sessions}
          activeSession={activeSession}
          onSelect={setActiveSession}
          onDelete={deleteSession}
          onNew={newChat}
          loading={loading}
        />
      </aside>

      {/* Chat Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="p-4 border-b flex items-center justify-between md:hidden" style={{ borderColor: 'var(--lx-border)' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSessions(true)} className="flex items-center justify-center rounded" style={{ color: 'var(--text-secondary)', minWidth: 36, minHeight: 36 }}>
              <Menu size={20} />
            </button>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Chat</h2>
          </div>
          <button onClick={newChat} className="lx-btn-primary text-xs py-1.5 px-3">
            <Plus size={13} /> New
          </button>
        </div>

        {activeSession ? (
          <ChatInterface
            key={activeSession}
            user={user}
            sessionId={activeSession}
            onNewSession={(id, title) => {
              setSessions(prev => {
                const exists = prev.find(s => s.id === id);
                if (exists) return prev.map(s => s.id === id ? { ...s, title } : s);
                return [{ id, title, lastMessage: '', date: new Date().toISOString(), messages: [] }, ...prev];
              });
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8 text-center">
            <Sparkles size={32} style={{ color: 'var(--lx-accent)' }} />
            <h3 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Start a conversation
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>Ask me anything about books or movies.</p>
            <button onClick={newChat} className="lx-btn-primary">
              New Chat <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Sessions Drawer */}
      {showSessions && (
        <div className="md:hidden fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSessions(false)}>
          <div
            className="w-72 max-w-[80vw] h-full flex flex-col border-r"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--lx-border)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Your Chats</span>
              <button onClick={() => setShowSessions(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <ChatSessionList
              sessions={sessions}
              activeSession={activeSession}
              onSelect={(id) => { setActiveSession(id); setShowSessions(false); }}
              onDelete={deleteSession}
              onNew={() => { newChat(); setShowSessions(false); }}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}