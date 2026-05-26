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
      const finished = lib.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 8);
      const reading = lib.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3);
      const wantToRead = lib.filter(b => b.status === 'want_to_read').map(b => b.book_title).slice(0, 5);
      const clubNames = clubs.map(c => c.club_id).slice(0, 5);
      const recentReviews = reviews.map(r => `${r.book_title} (${r.rating}/5)`).slice(0, 5);
      const recentPosts = posts.map(p => p.title).slice(0, 3);
      setUserContext({
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
        setMessages([{ role: 'assistant', content: "Hi! I'm your AI book companion. What are you in the mood to read?" }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: "Hello! What book are you looking for today?" }]);
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

    try {
      // Generate a clean short title async (non-blocking) on first message
      if (isFirstMessage && onNewSession) {
        base44.integrations.Core.InvokeLLM({
          prompt: `Create a short 3-5 word title for a book chat that started with this message: "${text}". Output ONLY the title, no quotes, no punctuation at end. Examples: "Books like Harry Potter", "Dark fantasy recommendations", "Help with reading list".`,
          model: 'gpt_5_mini'
        }).then(title => {
          const t = typeof title === 'string' ? title.trim() : text.slice(0, 45).trim();
          onNewSession(sessionId, t);
          // Update the existing messages with this title
          base44.entities.ChatMessage.filter({ user_email: user.email, session_id: sessionId }).then(existing => {
            existing.forEach(m => base44.entities.ChatMessage.update(m.id, { session_title: t }));
          }).catch(() => {});
        }).catch(() => {
          onNewSession(sessionId, text.slice(0, 45).trim());
        });
      }

      await base44.entities.ChatMessage.create({ user_email: user.email, role: 'user', content: text, session_id: sessionId });

      const recentMessages = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

      // Auto-name the session from first user message using LLM
      const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;

      const contextStr = userContext ? `
USER READING PROFILE (personalize everything based on this):
- Favorite genres: ${userContext.genres}
- Reading moods: ${userContext.moods}
- Pacing: ${userContext.pacing} | Difficulty: ${userContext.difficulty}
- Dislikes: ${userContext.dislikes} | Disliked genres: ${userContext.dislikedGenres}
- Favorite books: ${userContext.favoriteBooks}
- Currently reading: ${userContext.reading.join(', ') || 'none'}
- Recently finished: ${userContext.finished.join(', ') || 'none'}
- Want to read: ${userContext.wantToRead.join(', ') || 'none'}
- Book clubs joined: ${userContext.clubCount || 0}
- Recent reviews: ${userContext.recentReviews.join(', ') || 'none'}
- Recent forum posts: ${userContext.recentPosts.join(', ') || 'none'}` : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Lexio, a friendly AI assistant for the Lexio reading app. You help users with ANYTHING related to books and reading — recommendations, book clubs, reviews, tracking reading, finding books similar to ones they loved, discussing themes, authors, genres, reading challenges, and more.
${contextStr}

Previous conversation:
${recentMessages}

User message: "${text}"

Your rules:
1. ONLY answer questions related to books, reading, authors, genres, book clubs, reviews, reading habits, or the Lexio app features (library, clubs, reviews, reading log, streaks, forums). 
2. If the user asks about something completely unrelated to reading or Lexio (e.g. cooking, sports, coding), kindly redirect them: acknowledge their question briefly, then steer back to books or Lexio. Never be rude.
3. When recommending books, always reference their profile above and explain WHY it matches them.
4. Help with book clubs: suggest books for clubs, discussion questions, reading schedules.
5. Format book recommendations as: **Title** by Author — brief reason.
6. Keep responses under 300 words unless listing many books.`,
        model: 'claude_sonnet_4_6'
      });

      const aiContent = typeof response === 'string' ? response : response?.text || 'Here are some recommendations for you!';

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

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
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
            placeholder="Ask me anything — books, clubs, recommendations..."
            className="lx-input flex-1" />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="lx-btn-primary px-4"
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}