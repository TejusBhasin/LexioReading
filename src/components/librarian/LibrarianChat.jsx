import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Lock, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PinPad from '@/components/ui/PinPad';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'Recommend a fantasy book for teens',
  'What should I read if I liked Percy Jackson?',
  'Best mystery novels this year',
  'Find me a book about space',
];

export default function LibrarianChat({ pin, onExit }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm the Lexio Librarian. Ask me for book recommendations, author info, or anything book-related!"
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExitPin, setShowExitPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('librarianChat', { message: text });

      const aiContent = response.data?.reply || 'Let me help you find something great to read!';
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble with that. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleExitPin(entered) {
    if (entered === pin) {
      localStorage.removeItem('lexio_librarian_mode');
      onExit();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1000);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--lx-accent)' }}>
            <Sparkles size={14} style={{ color: 'var(--bg-primary)' }} />
          </div>
          <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Lexio Librarian</span>
        </div>
        <button onClick={() => setShowExitPin(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
          <Lock size={13} /> Exit
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                <Sparkles size={13} />
              </div>
            )}
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm"
              style={{
                background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--lx-border)' : 'none'
              }}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm max-w-none" components={{
                  p: ({ children }) => <p className="my-1">{children}</p>,
                  strong: ({ children }) => <strong style={{ color: 'var(--lx-accent)' }}>{children}</strong>,
                  ul: ({ children }) => <ul className="my-1 pl-4 list-disc">{children}</ul>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                }}>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
              <Sparkles size={13} />
            </div>
            <div className="px-4 py-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'var(--lx-accent)', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--lx-border)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}>
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-xs px-2.5 py-1 rounded transition-all truncate max-w-[220px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask the librarian for a book recommendation..."
            className="lx-input flex-1" />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="lx-btn-primary px-4"
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Exit PIN overlay */}
      {showExitPin && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <button onClick={() => setShowExitPin(false)} className="absolute top-4 right-4">
            <X size={24} style={{ color: 'var(--text-muted)' }} />
          </button>
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--lx-accent)' }}>
              <Lock size={22} style={{ color: 'var(--bg-primary)' }} />
            </div>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Enter PIN to Exit</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Librarian access required</p>
          </div>
          <PinPad onComplete={handleExitPin} />
          {pinError && <p className="mt-4 text-sm font-medium" style={{ color: '#f87171' }}>Wrong PIN, try again</p>}
        </div>
      )}
    </div>
  );
}