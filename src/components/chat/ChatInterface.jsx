import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
function uuidv4() {
  return 'chat-' + Math.random().toString(36).slice(2) + '-' + Date.now();
}

const DEMO_RESPONSES = [
  "I'd love to help you find books! Sign up for full access to get personalized AI recommendations based on your taste. 📚",
  "Great question! As a demo user, I can tell you a bit about books. For full personalized recommendations, create a free account!",
];

const SUGGESTIONS = [
  'Recommend something like Harry Potter but darker',
  'I want a fast-paced thriller',
  'Best books for learning about AI',
  'Something emotional that made people cry',
  'Underrated sci-fi from the last 5 years',
];

export default function ChatInterface({ user, sessionId: initialSessionId, onNewSession }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(initialSessionId || uuidv4());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isDemo = !user;

  useEffect(() => {
    if (user?.email) loadUserContext();
  }, [user]);

  async function loadUserContext() {
    try {
      const [prefs, lib, profile] = await Promise.all([
        base44.entities.UserPreferences.filter({ user_email: user.email }),
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.UserProfile.filter({ user_email: user.email }),
      ]);
      const p = prefs[0] || {};
      const finished = lib.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 5);
      const reading = lib.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3);
      setUserContext({
        genres: (p.favorite_genres || []).join(', ') || 'not set',
        moods: (p.moods || []).join(', ') || 'not set',
        pacing: p.pacing || 'any',
        difficulty: p.difficulty || 'any',
        dislikes: (p.disliked_content || []).join(', ') || 'none',
        dislikedGenres: (p.disliked_genres || []).join(', ') || 'none',
        finished,
        reading,
        username: profile[0]?.username || user.full_name || '',
      });
    } catch (e) {}
  }

  useEffect(() => {
    if (user?.email && sessionId) {
      loadHistory();
    } else {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI book companion. Ask me anything — 'I want something like Harry Potter but darker' or 'recommend a fast-paced thriller'. What are you in the mood for?"
      }]);
    }
  }, [user, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { user_email: user.email, session_id: sessionId },
        'created_date',
        100
      );
      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm your AI book companion. What are you in the mood to read?"
        }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: "Hello! What book are you looking for today?" }]);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)]
        }]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      // Save user message
      await base44.entities.ChatMessage.create({
        user_email: user.email,
        role: 'user',
        content: text,
        session_id: sessionId,
      });

      // Build context from recent messages
      const recentMessages = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

      const contextStr = userContext ? `
User reading profile:
- Favorite genres: ${userContext.genres}
- Reading moods: ${userContext.moods}
- Pacing preference: ${userContext.pacing}
- Difficulty preference: ${userContext.difficulty}
- Disliked content: ${userContext.dislikes}
- Disliked genres: ${userContext.dislikedGenres}
- Recently finished: ${userContext.finished.join(', ') || 'none'}
- Currently reading: ${userContext.reading.join(', ') || 'none'}` : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Lexio, an expert AI book companion. You help users discover books they'll love through natural conversation.
${contextStr}

Previous conversation:
${recentMessages}

User message: "${text}"

Your job:
1. Recommend specific books with titles and authors — always use the user's preferences above
2. Explain WHY each book matches their request and profile
3. Ask follow-up questions to refine recommendations
4. Be enthusiastic but concise — bullet points work well for book lists
5. Format book recommendations as: **Title** by Author — brief reason

Keep responses focused and under 300 words unless listing many books.`,
        model: 'claude_sonnet_4_6'
      });

      // Award chat point
      import('@/lib/points').then(({ awardPoints }) => awardPoints(user.email, 'chat', userContext?.username || ''));

      const aiContent = typeof response === 'string' ? response : response?.text || 'Here are some recommendations for you!';

      // Save AI response
      await base44.entities.ChatMessage.create({
        user_email: user.email,
        role: 'assistant',
        content: aiContent,
        session_id: sessionId,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble with that. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                <Sparkles size={13} />
              </div>
            )}
            <div
              className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm"
              style={{
                background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--lx-border)' : 'none',
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  className="prose prose-sm max-w-none"
                  components={{
                    p: ({ children }) => <p className="my-1">{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--lx-accent)' }}>{children}</strong>,
                    ul: ({ children }) => <ul className="my-1 pl-4 list-disc">{children}</ul>,
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
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
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--lx-accent)', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--lx-border)' }}>
        {isDemo && (
          <p className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>
            Demo mode — <a href="/signup" style={{ color: 'var(--lx-accent)' }}>Sign up</a> for full AI chat
          </p>
        )}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-xs px-2.5 py-1 rounded transition-all truncate max-w-[200px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me about books... 'I want something dark and twisty'"
            className="lx-input flex-1"
            style={{ paddingRight: '1rem' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="lx-btn-primary px-4"
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}