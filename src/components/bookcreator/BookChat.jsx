import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CHAT_SYSTEM_PROMPT, CHAT_RESPONSE_SCHEMA } from '@/lib/bookCreator';

export default function BookChat({ onBookReady, genre }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: genre
      ? `Hi! I'm your Custom Book Creator AI. You've selected **${genre}** as your genre. Tell me about the book you'd like to create — what's the general idea, setting, or characters you have in mind?`
      : "Hi! I'm your Custom Book Creator AI. Tell me about the book you'd like to create — what genre are you thinking, and what's the general idea?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const genreLine = genre ? `\n\nThe user has already selected the genre: ${genre}. Use this as the book's genre unless the user explicitly asks to change it.` : '';
      const history = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${CHAT_SYSTEM_PROMPT}${genreLine}\n\nConversation so far:\n${history}\n\nAssistant:`,
        response_json_schema: CHAT_RESPONSE_SCHEMA,
      });

      const response = typeof result === 'string' ? JSON.parse(result) : result;
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
      </div>
    </div>
  );
}