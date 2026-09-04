import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { awardPoints } from '@/lib/points';
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
  'Recommend a sci-fi movie like Interstellar',
  'Something emotional that made people cry',
  'Underrated sci-fi from the last 5 years',
];

function greetingFor(mode) {
  if (mode === 'movies') return "Hi! I'm your Lexio movie companion. What are you in the mood to watch?";
  if (mode === 'books_movies') return "Hi! I'm your Lexio reading and movies companion. What are you in the mood to read or watch?";
  return "Hi! I'm your Lexio reading companion. What are you in the mood to read?";
}

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

  // Update the greeting once we know the user's content mode (if no message sent yet)
  useEffect(() => {
    if (userContext && messages.length === 1 && messages[0].role === 'assistant' && !messages.some(m => m.role === 'user')) {
      const g = greetingFor(userContext.contentMode);
      setMessages(prev => (prev[0]?.content === g ? prev : [{ role: 'assistant', content: g }]));
    }
  }, [userContext]);

  useEffect(() => {
    if (user?.email && sessionId) {
      loadHistory();
    } else {
      setMessages([{
        role: 'assistant',
        content: greetingFor(userContext?.contentMode)
      }]);
    }
  }, [user, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadUserContext() {
    try {
      const [prefs, lib, clubs, reviews, posts] = await Promise.all([
        base44.entities.UserPreferences.filter({ user_email: user.email }),
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.BookClubMember.filter({ user_email: user.email }),
        base44.entities.Review.filter({ user_email: user.email }, '-created_date', 5),
        base44.entities.ForumPost.filter({ author_email: user.email }, '-created_date', 3),
      ]);
      const p = prefs[0] || {};
      const books = lib.filter(b => (b.media_type || 'book') === 'book');
      const movies = lib.filter(b => b.media_type === 'movie');
      const finished = books.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 8);
      const reading = books.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3);
      const wantToRead = books.filter(b => b.status === 'want_to_read').map(b => b.book_title).slice(0, 5);
      const watchedMovies = movies.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 8);
      const watchingMovies = movies.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3);
      const clubNames = clubs.map(c => c.club_id).slice(0, 5);
      const recentReviews = reviews.map(r => `${r.book_title} (${r.rating}/5)`).slice(0, 5);
      const recentPosts = posts.map(p => p.title).slice(0, 3);
      setUserContext({
        contentMode: p.content_mode || 'books',
        genres: (p.favorite_genres || []).join(', ') || 'not set',
        moods: (p.moods || []).join(', ') || 'not set',
        pacing: p.pacing || 'any',
        difficulty: p.difficulty || 'any',
        dislikes: (p.disliked_content || []).join(', ') || 'none',
        dislikedGenres: (p.disliked_genres || []).join(', ') || 'none',
        favoriteBooks: (p.favorite_books || []).join(', ') || 'none',
        finished,
        reading,
        wantToRead,
        watchedMovies,
        watchingMovies,
        clubCount: clubs.length,
        recentReviews,
        recentPosts,
      });
    } catch (e) {}
  }

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
        setMessages([{ role: 'assistant', content: greetingFor(userContext?.contentMode) }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: greetingFor(userContext?.contentMode) }]);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)] }]);
        setLoading(false);
      }, 1000);
      return;
    }

    // Declare before use
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;

    try {
      await base44.entities.ChatMessage.create({ user_email: user.email, role: 'user', content: text, session_id: sessionId });

      const response = await base44.functions.invoke('companionChat', {
        message: text,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        first: isFirstMessage,
      });

      const aiContent = response.data?.reply || 'Here are some recommendations for you!';

      if (isFirstMessage && onNewSession && response.data?.title) {
        const t = response.data.title;
        onNewSession(sessionId, t);
        base44.entities.ChatMessage.filter({ user_email: user.email, session_id: sessionId }).then(existing => {
          existing.forEach(m => base44.entities.ChatMessage.update(m.id, { session_title: t }));
        }).catch(() => {});
      }

      await base44.entities.ChatMessage.create({ user_email: user.email, role: 'assistant', content: aiContent, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      await awardPoints(user.email, 'chat', user.full_name);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble with that. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleScrollAreaKey(e) {
    if (e.key === ' ') e.preventDefault();
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide" onKeyDown={handleScrollAreaKey} tabIndex={-1} style={{ outline: 'none' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                <Sparkles size={13} />
              </div>
            )}
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm"
              style={{ background: msg.role === 'user' ? 'var(--lx-accent)' : 'var(--bg-card)', color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)', border: msg.role === 'assistant' ? '1px solid var(--lx-border)' : 'none' }}>
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
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--lx-accent)', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--lx-border)' }}>
        {isDemo && (
          <p className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>
            Demo mode — <a href="/signup" style={{ color: 'var(--lx-accent)' }}>Sign up</a> for full AI chat
          </p>
        )}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTIONS.slice(0, 4).map(s => (
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
            placeholder="Ask for book or movie recommendations..."
            className="lx-input flex-1" />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="lx-btn-primary px-4"
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          AI provides recommendations only — no plot summaries or spoilers.
        </p>
      </div>
    </div>
  );
}