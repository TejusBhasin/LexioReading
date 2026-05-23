import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import { searchBooks } from '@/lib/googleBooks';
import AppLayout from '@/components/layout/AppLayout';
import { Send, Lock, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CONVERSATION_ID_KEY = 'lexio_current_convo';

export default function Chat() {
  const { user } = useLexioAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => {
    const stored = sessionStorage.getItem(CONVERSATION_ID_KEY);
    if (stored) return stored;
    const newId = `convo_${Date.now()}`;
    sessionStorage.setItem(CONVERSATION_ID_KEY, newId);
    return newId;
  });
  const bottomRef = useRef(null);

  useEffect(() => {
    if (user) loadHistory();
    else {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Lexio, your AI reading companion. Ask me for book recommendations or anything about books. **Sign up for full access** — I'll remember our conversation and learn your taste over time.",
        id: 'welcome'
      }]);
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    const history = await base44.entities.ChatMessage.filter(
      { user_email: user.email, conversation_id: conversationId },
      'created_date'
    );
    if (history.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Welcome back${user.full_name ? ', ' + user.full_name.split(' ')[0] : ''}! I'm your AI reading companion. What kind of book are you in the mood for?`,
        id: 'welcome'
      }]);
    } else {
      setMessages(history);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    const userMsgObj = { role: 'user', content: userMsg, id: Date.now() };
    setMessages(prev => [...prev, userMsgObj]);
    setLoading(true);

    if (user) {
      await base44.entities.ChatMessage.create({
        user_email: user.email,
        conversation_id: conversationId,
        role: 'user',
        content: userMsg,
      });
    }

    try {
      // Build context from previous messages
      const recentMsgs = messages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'Lexio'}: ${m.content}`).join('\n');
      
      // Get user prefs for context
      let prefsContext = '';
      if (user) {
        const prefsArr = await base44.entities.UserPreferences.filter({ user_email: user.email });
        const prefs = prefsArr[0] || {};
        prefsContext = `User preferences: genres=${(prefs.favorite_genres||[]).join(',')}, moods=${(prefs.moods||[]).join(',')}, pacing=${prefs.pacing}, difficulty=${prefs.difficulty}`;
      }

      const prompt = `You are Lexio, an expert AI book recommendation assistant. Be concise, warm, and insightful.
${prefsContext}

Recent conversation:
${recentMsgs}

User's new message: "${userMsg}"

Respond naturally. If the user is asking for book recommendations, suggest 2-4 books with specific reasons tailored to them.
Format recommendations clearly with book title in bold, author, and a one-sentence "why this book" explanation.
Keep responses focused and under 300 words unless asked for more detail.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });

      const assistantMsg = { role: 'assistant', content: response, id: Date.now() + 1 };
      setMessages(prev => [...prev, assistantMsg]);

      if (user) {
        await base44.entities.ChatMessage.create({
          user_email: user.email,
          conversation_id: conversationId,
          role: 'assistant',
          content: response,
        });

        // Extract and update preferences from conversation
        extractAndUpdatePrefs(userMsg, user.email);
      }
    } catch (err) {
      const errMsg = { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again!', id: Date.now() + 1 };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function extractAndUpdatePrefs(userMessage, email) {
    // Silently try to extract preferences from the message
    try {
      const prompt = `Analyze this message from a reader and extract any book preferences mentioned.
Message: "${userMessage}"
Return JSON with only the fields that are explicitly mentioned: liked_genres (array), disliked_genres (array), liked_moods (array), liked_pacing (string: fast/slow/medium), notes (any other preference as string).
Return empty arrays/null for fields not mentioned. Do not invent preferences.`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            liked_genres: { type: 'array', items: { type: 'string' } },
            disliked_genres: { type: 'array', items: { type: 'string' } },
            liked_moods: { type: 'array', items: { type: 'string' } },
            liked_pacing: { type: 'string' },
          }
        }
      });

      const prefsArr = await base44.entities.UserPreferences.filter({ user_email: email });
      if (prefsArr.length > 0) {
        const prefs = prefsArr[0];
        const updates = {};
        if (extracted.liked_genres?.length) {
          updates.favorite_genres = [...new Set([...(prefs.favorite_genres || []), ...extracted.liked_genres])];
        }
        if (extracted.disliked_genres?.length) {
          updates.disliked_genres = [...new Set([...(prefs.disliked_genres || []), ...extracted.disliked_genres])];
        }
        if (extracted.liked_moods?.length) {
          updates.moods = [...new Set([...(prefs.moods || []), ...extracted.liked_moods])];
        }
        if (Object.keys(updates).length > 0) {
          await base44.entities.UserPreferences.update(prefs.id, updates);
        }
      }
    } catch {}
  }

  const SUGGESTIONS = [
    "I want something like Harry Potter but darker",
    "Best sci-fi books to read in 2025",
    "I hated slow books like Dune, what should I try?",
    "Books that changed people's lives",
  ];

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-8rem)]">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>AI Book Chat</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid var(--accent-primary)' }}>
              <Lock size={14} style={{ color: 'var(--accent-primary)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>Demo mode — sign up to save chat history and get personalized AI</p>
              <Link to="/signup" className="ml-auto text-xs font-black px-3 py-1 rounded-lg" style={{ background: 'var(--accent-primary)', color: '#000' }}>Sign Up</Link>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <ChatInput input={input} setInput={setInput} onSend={sendMessage} loading={loading} suggestions={SUGGESTIONS} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>AI Book Chat</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem(CONVERSATION_ID_KEY);
              window.location.reload();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            <RotateCcw size={12} />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="p-3 rounded-xl text-xs font-medium text-left transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <ChatInput input={input} setInput={setInput} onSend={sendMessage} loading={loading} />
      </div>
    </AppLayout>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'var(--accent-primary)' }}>
          <BookOpen size={14} style={{ color: '#000' }} />
        </div>
      )}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--accent-primary)' : 'var(--bg-card)',
          color: isUser ? '#000' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--border-color)',
        }}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong style={{ color: 'var(--accent-primary)' }}>{children}</strong>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-primary)' }}>
        <BookOpen size={14} style={{ color: '#000' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatInput({ input, setInput, onSend, loading, suggestions }) {
  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
        placeholder="Ask for book recommendations..."
        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: 'var(--bg-card)', border: '2px solid var(--border-color)', color: 'var(--text-primary)' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
      />
      <button
        onClick={onSend}
        disabled={loading || !input.trim()}
        className="px-4 py-3 rounded-xl font-bold transition-all"
        style={{ background: 'var(--accent-primary)', color: '#000', opacity: (loading || !input.trim()) ? 0.5 : 1 }}
      >
        <Send size={16} />
      </button>
    </div>
  );
}