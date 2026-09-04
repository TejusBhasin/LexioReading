import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BookChat({ onBookReady, genre, style }) {
  const introParts = ["Hi! I'm your Custom Book Creator AI."];
  if (genre) introParts.push(`You've selected **${genre}** as your genre.`);
  if (style) introParts.push(`You've chosen a **${style}** writing style.`);
  introParts.push("Tell me about the book you'd like to create — what's the general idea, setting, or characters you have in mind?");
  const [messages, setMessages] = useState([
    { role: 'assistant', content: introParts.join(' ') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(msgOverride) {
    const userMsg = msgOverride || input.trim();
    if (!userMsg || loading) return;
    if (!msgOverride) setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const result = await base44.functions.invoke('bookCreatorChat', {
        genre,
        style,
        history: newMessages.map(m => ({ role: m.role, content: m.content })),
      });

      const response = result.data || {};
      setMessages(prev => [...prev, { role: 'assistant', content: response.message || response }]);

      if (response.ready && response.book_spec) {
        setTimeout(() => onBookReady(response.book_spec), 800);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble processing that. Could you try again?" }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
              style={{
                background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--lx-border)',
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--lx-accent)', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--lx-accent)', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--lx-accent)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--lx-border)' }}>
        <div className="flex gap-2">
          <input
            className="lx-input text-sm flex-1"
            placeholder="Describe your book idea..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="lx-btn-primary px-4">
            <Send size={16} />
          </button>
        </div>
        <button onClick={() => send("I'd like to skip this question.")} disabled={loading}
          className="w-full text-xs py-2 mt-2 rounded transition-all"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--lx-border)' }}>
          Skip this question
        </button>
      </div>
    </div>
  );
}