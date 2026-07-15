import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.toDateString() === db.toDateString();
}

export default function ClubChat({ club, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [myUsername, setMyUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
      setMyUsername(profiles[0]?.username || '');
    }).catch(() => setMyUsername(''));
  }, [user?.email]);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ChainMessage.subscribe((event) => {
      if (event.data?.club_id === club.id && event.data?.chain_id === 'general') {
        setMessages(prev => {
          if (event.type === 'create') {
            if (prev.some(m => m.id === event.data.id)) return prev;
            return [...prev, event.data];
          }
          if (event.type === 'delete') return prev.filter(m => m.id !== event.id);
          return prev;
        });
      }
    });
    return unsub;
  }, [club.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const msgs = await base44.entities.ChainMessage.filter({ club_id: club.id, chain_id: 'general' }, 'created_date', 100);
      setMessages(msgs);
    } catch (e) {}
    setLoading(false);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      await base44.entities.ChainMessage.create({
        club_id: club.id,
        chain_id: 'general',
        user_email: user.email,
        username: myUsername || null,
        content,
      });
    } catch (e) {}
    setSending(false);
  }

  async function deleteMessage(msg) {
    if (!confirm('Delete this message?')) return;
    try {
      await base44.entities.ChainMessage.delete(msg.id);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (e) {}
  }

  let lastDate = null;

  return (
    <div className="lx-card flex flex-col" style={{ height: '60vh' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle size={32} className="mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_email === user?.email;
            const showDateSep = !lastDate || !isSameDay(lastDate, msg.created_date);
            lastDate = msg.created_date;
            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-xs px-3 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {new Date(msg.created_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                  {!isMe && msg.username && (
                    <Link to={`/u/${msg.username}`} className="text-xs mb-0.5 px-1 hover:underline" style={{ color: 'var(--text-muted)' }}>@{msg.username}</Link>
                  )}
                  <div className="flex items-end gap-1.5 max-w-[80%]">
                    {isMe && (
                      <button onClick={() => deleteMessage(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }} title="Delete">
                        <Trash2 size={11} />
                      </button>
                    )}
                    <div
                      className="px-3.5 py-2 rounded-2xl text-sm"
                      style={{
                        background: isMe ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                        color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                        borderBottomRightRadius: isMe ? '4px' : undefined,
                        borderBottomLeftRadius: !isMe ? '4px' : undefined,
                      }}
                    >
                      {msg.content}
                      <span className="text-[9px] block mt-0.5" style={{ opacity: 0.6 }}>
                        {formatTime(msg.created_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t" style={{ borderColor: 'var(--lx-border)' }}>
        <input
          className="lx-input flex-1 text-sm"
          placeholder="Send a message..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim() || sending} className="lx-btn-primary px-3">
          {sending ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-primary)', borderTopColor: 'transparent' }} /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}