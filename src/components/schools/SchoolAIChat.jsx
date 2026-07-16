import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, RefreshCw, Bot, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function SchoolAIChat({ schoolId, classId, scopeLabel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setOverview('');
    loadOverview();
  }, [schoolId, classId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function loadOverview() {
    setLoadingOverview(true);
    try {
      const res = await base44.functions.invoke('schoolAIChat', {
        school_id: schoolId,
        class_id: classId,
        mode: 'overview',
      });
      setOverview(res.data?.answer || 'Unable to generate overview.');
    } catch (e) {
      setOverview('Unable to generate overview. Please try again later.');
    }
    setLoadingOverview(false);
  }

  async function sendQuestion() {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('schoolAIChat', {
        school_id: schoolId,
        class_id: classId,
        question: q,
        mode: 'chat',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data?.answer || 'Sorry, I could not process that.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  }

  const suggestions = classId
    ? ['Who are the most active readers?', 'Which students need encouragement?', 'What books are popular in this class?']
    : ['What are the overall reading trends?', 'Which classes are most active?', 'Who are the top readers school-wide?'];

  return (
    <div className="space-y-5">
      {/* AI Overview */}
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--lx-accent)' }} />
            <h3 className="font-display text-base font-bold" style={{ color: 'var(--text-primary)' }}>AI Overview</h3>
          </div>
          <button onClick={loadOverview} disabled={loadingOverview} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="Refresh">
            <RefreshCw size={14} className={loadingOverview ? 'animate-spin' : ''} />
          </button>
        </div>
        {loadingOverview ? (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing reading data...</span>
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm" style={{ color: 'var(--text-secondary)' }}>
            <ReactMarkdown>{overview}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="rounded-xl flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', height: '400px' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--lx-border)' }}>
          <Bot size={16} style={{ color: 'var(--lx-accent)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Analytics Assistant</h3>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{scopeLabel}</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Ask me anything about your students' reading data.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
                  <Bot size={12} style={{ color: 'var(--lx-accent)' }} />
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? '' : ''}`}
                style={{
                  background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                  color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}>
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                  <User size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
                <Bot size={12} style={{ color: 'var(--lx-accent)' }} />
              </div>
              <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--text-muted)', animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--lx-border)' }}>
          <div className="flex gap-2">
            <input
              className="lx-input text-sm flex-1"
              placeholder="Ask about reading data, engagement, trends..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendQuestion()}
              disabled={loading}
            />
            <button onClick={sendQuestion} disabled={!input.trim() || loading}
              className="lx-btn-primary px-3">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}