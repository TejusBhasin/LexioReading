import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MessageSquare, Sparkles, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ChatInterface from '@/components/chat/ChatInterface';
function uuidv4() {
  return 'chat-' + Math.random().toString(36).slice(2) + '-' + Date.now();
}

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);

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
          AI Book Chat
        </h2>
        <p className="mb-4 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Ask anything about books. Get personalized recommendations through natural conversation.
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
    <div className="max-w-6xl mx-auto h-full flex">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ borderColor: 'var(--lx-border)', background: 'var(--bg-secondary)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--lx-border)' }}>
          <button onClick={newChat} className="lx-btn-primary w-full justify-center text-sm">
            <Plus size={14} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && !loading && (
            <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No chats yet</p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className="group w-full text-left px-4 py-3 border-b transition-all"
              style={{
                borderColor: 'var(--lx-border)',
                background: activeSession === s.id ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: activeSession === s.id ? `2px solid var(--lx-accent)` : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-2 pr-1">
                <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
                <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                  {s.title || 'Chat'}
                </span>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="flex-shrink-0 p-1 rounded transition-opacity opacity-40 hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {s.lastMessage && (
                <p className="text-xs mt-0.5 truncate pl-5" style={{ color: 'var(--text-muted)' }}>
                  {s.lastMessage.slice(0, 50)}
                </p>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b flex items-center justify-between md:hidden" style={{ borderColor: 'var(--lx-border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Book Chat</h2>
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
            <p style={{ color: 'var(--text-muted)' }}>Ask me anything about books.</p>
            <button onClick={newChat} className="lx-btn-primary">
              New Chat <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}