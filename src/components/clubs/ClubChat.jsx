import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ClubChat({ club, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ChainMessage.subscribe((event) => {
      if (event.data?.club_id === club.id && event.data?.chain_id === 'general') {
        setMessages(prev => {
          if (event.type === 'create') return [...prev, event.data];
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
    const msgs = await base44.entities.ChainMessage.filter({ club_id: club.id, chain_id: 'general' }, 'created_date', 100);
    setMessages(msgs);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await base44.entities.ChainMessage.create({
      club_id: club.id,
      chain_id: 'general',
      user_email: user.email,
      username: user.full_name || user.email.split('@')[0],
      content,
    });
    setSending(false);
  }

  return (
    <div className="lx-card flex flex-col" style={{ height: '60vh' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.user_email === user?.email;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-xs mb-1 px-1" style={{ color: 'var(--text-muted)' }}>{msg.username}</span>
              )}
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm"
                style={{
                  background: isMe ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                  color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
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
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}