import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// The AI reading/watching companion chat (logged-in users only). Builds the
// user's taste context from their own records server-side and keeps the
// companion's rules (anti-cheating, no spoilers) server-side.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const text = (body?.message || '').trim();
    if (!text) return Response.json({ error: 'message is required' }, { status: 400 });
    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
    const first = !!body?.first;

    const email = user.email;
    const [prefsList, lib, clubs, reviews, posts] = await Promise.all([
      base44.asServiceRole.entities.UserPreferences.filter({ user_email: email }).catch(() => []),
      base44.asServiceRole.entities.UserLibrary.filter({ user_email: email }).catch(() => []),
      base44.asServiceRole.entities.BookClubMember.filter({ user_email: email }).catch(() => []),
      base44.asServiceRole.entities.Review.filter({ user_email: email }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.ForumPost.filter({ author_email: email }, '-created_date', 3).catch(() => []),
    ]);
    const p = prefsList[0] || {};
    const books = lib.filter(b => (b.media_type || 'book') === 'book');
    const movies = lib.filter(b => b.media_type === 'movie');
    const contentMode = p.content_mode || 'books';
    const companion = contentMode === 'movies' ? 'movie' : contentMode === 'books_movies' ? 'reading and movies' : 'reading';

    const contextStr = `
USER PROFILE (personalize everything based on this):
- Content mode: ${contentMode} (books only, movies only, or both)
- Favorite genres: ${(p.favorite_genres || []).join(', ') || 'not set'}
- Reading moods: ${(p.moods || []).join(', ') || 'not set'}
- Pacing: ${p.pacing || 'any'} | Difficulty: ${p.difficulty || 'any'}
- Dislikes: ${(p.disliked_content || []).join(', ') || 'none'} | Disliked genres: ${(p.disliked_genres || []).join(', ') || 'none'}
- Favorite books: ${(p.favorite_books || []).join(', ') || 'none'}
- Currently reading: ${books.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3).join(', ') || 'none'}
- Recently finished books: ${books.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 8).join(', ') || 'none'}
- Want to read: ${books.filter(b => b.status === 'want_to_read').map(b => b.book_title).slice(0, 5).join(', ') || 'none'}
- Watched movies: ${movies.filter(b => b.status === 'finished').map(b => b.book_title).slice(0, 8).join(', ') || 'none'}
- Currently watching: ${movies.filter(b => b.status === 'reading').map(b => b.book_title).slice(0, 3).join(', ') || 'none'}
- Book clubs joined: ${clubs.length || 0}
- Recent reviews: ${reviews.map(r => `${r.book_title} (${r.rating}/5)`).slice(0, 5).join(', ') || 'none'}
- Recent forum posts: ${posts.map(x => x.title).slice(0, 3).join(', ') || 'none'}`;

    const recentMessages = history.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are Lexio, a friendly AI assistant for the Lexio ${companion} companion app. You help users with ANYTHING related to books AND movies — recommendations, clubs, reviews, tracking reading/watching, finding books or films similar to ones they loved, discussing themes, authors, directors, genres, and more. Adapt to the user's content mode (books only, movies only, or both) shown in their profile.
${contextStr}

Previous conversation:
${recentMessages}

User message: "${text}"

Your rules:
1. You are a BOOK & MOVIE recommendation assistant. You help users discover books and movies, discuss genres, authors, and directors, and find their next read or watch.
2. ANTI-CHEATING — CRITICAL: NEVER provide plot summaries, chapter summaries, detailed plot recaps, or tell the user "what happens" in a book. Many users are students with assigned reading — helping them avoid reading is strictly forbidden.
3. If a user asks for a summary, recap, "tell me what happens", "explain the plot", "give me the cliff notes", or anything that sounds like they want to avoid reading the book, politely decline: "I can't provide book summaries — that would ruin the reading experience! I can tell you about the genre, who'd enjoy it, or recommend similar books instead."
4. NEVER reveal spoilers, twists, endings, character deaths, or specific plot events for any book or movie.
5. You MAY discuss: high-level themes (without revealing plot), genre, writing style, target audience, similar books or films, author/director background, series reading order, and whether a book or movie matches someone's taste.
6. If the user asks about something completely unrelated to reading, books, or movies (e.g. math homework, coding, cooking), kindly redirect them back to books or movies. Never be rude.
7. When recommending, reference their profile above and explain WHY it matches.
8. Format recommendations as: **Title** by Author/Director — brief reason. For movies, note the director if known.
9. Keep responses under 300 words unless listing many titles.`,
      model: 'claude_sonnet_4_6',
    });

    const reply = typeof response === 'string' ? response : response?.text || 'Here are some recommendations for you!';

    // On the first message of a session, also produce a short session title.
    let title = null;
    if (first) {
      try {
        const t = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Create a short 3-5 word title for a book chat that started with this message: "${text}". Output ONLY the title, no quotes, no punctuation at end. Examples: "Books like Harry Potter", "Dark fantasy recommendations", "Help with reading list".`,
          model: 'gpt_5_mini',
        });
        if (typeof t === 'string' && t.trim()) title = t.trim();
      } catch (e) {}
    }

    return Response.json({ reply, title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}