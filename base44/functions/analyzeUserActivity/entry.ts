// Analyzes a user's reviews, posts, ratings, discussions and updates their reading strength
// and preference profile for personalized recommendations.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_email, activity_type, content, book_title, book_author, rating } = await req.json();

    // Gather recent activity for AI analysis
    const [reviews, discussions, forumPosts, clubPosts, library] = await Promise.all([
      base44.entities.Review.filter({ user_email }).catch(() => []),
      base44.entities.Discussion.filter({ user_email }, '-created_date', 50).catch(() => []),
      base44.entities.ForumPost.filter({ author_email: user_email }, '-created_date', 30).catch(() => []),
      base44.entities.ClubPost.filter({ user_email }, '-created_date', 30).catch(() => []),
      base44.entities.UserLibrary.filter({ user_email }).catch(() => []),
    ]);

    const finishedBooks = library.filter(b => b.status === 'finished');
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0;

    // Build a context summary for the AI
    const reviewSummary = reviews.slice(0, 20).map(r => `"${r.book_title}" rated ${r.rating}/5: ${r.body || ''}`).join('\n');
    const discussionSummary = discussions.slice(0, 15).map(d => d.content).join('\n');
    const libraryTitles = finishedBooks.slice(0, 20).map(b => `${b.book_title} by ${b.book_author}`).join(', ');

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this user's reading activity and extract their taste profile for personalized book recommendations.

REVIEWS (with ratings):
${reviewSummary || 'No reviews yet'}

DISCUSSIONS & POSTS:
${discussionSummary || 'No discussions yet'}

FINISHED BOOKS:
${libraryTitles || 'No finished books yet'}

LATEST ACTIVITY: ${activity_type} — "${content || ''}" about "${book_title || ''}" by "${book_author || ''}" (rating: ${rating || 'N/A'})

Return a JSON object with:
- favorite_genres: array of up to 5 genre strings the user clearly enjoys
- disliked_genres: array of genres they seem to dislike based on low ratings / negative comments
- favorite_authors: array of authors they seem to love
- preferred_themes: array of themes/moods they gravitate toward (e.g. "mystery", "space", "magic", "philosophy")
- avoid_themes: array of themes to avoid
- reading_complexity: one of "light", "moderate", "complex" — how complex they like books
- recommendation_seeds: array of 3-5 book titles they rated highly or talked positively about (to use as seeds for similar recommendations)
- strength_boost: number 0-5 representing how much this activity should boost reading strength engagement score`,
      response_json_schema: {
        type: 'object',
        properties: {
          favorite_genres: { type: 'array', items: { type: 'string' } },
          disliked_genres: { type: 'array', items: { type: 'string' } },
          favorite_authors: { type: 'array', items: { type: 'string' } },
          preferred_themes: { type: 'array', items: { type: 'string' } },
          avoid_themes: { type: 'array', items: { type: 'string' } },
          reading_complexity: { type: 'string' },
          recommendation_seeds: { type: 'array', items: { type: 'string' } },
          strength_boost: { type: 'number' },
        }
      }
    });

    // Upsert user preferences with AI analysis
    const existingPrefs = await base44.entities.UserPreferences.filter({ user_email }).catch(() => []);
    const prefData = {
      user_email,
      ai_favorite_genres: analysis.favorite_genres || [],
      ai_disliked_genres: analysis.disliked_genres || [],
      ai_favorite_authors: analysis.favorite_authors || [],
      ai_preferred_themes: analysis.preferred_themes || [],
      ai_avoid_themes: analysis.avoid_themes || [],
      ai_reading_complexity: analysis.reading_complexity || 'moderate',
      ai_recommendation_seeds: analysis.recommendation_seeds || [],
      ai_last_analyzed: new Date().toISOString(),
    };

    if (existingPrefs[0]) {
      await base44.entities.UserPreferences.update(existingPrefs[0].id, prefData);
    } else {
      await base44.entities.UserPreferences.create(prefData);
    }

    // Boost engagement score in reading strength
    if (analysis.strength_boost > 0) {
      const pts = await base44.entities.UserPoints.filter({ user_email }).catch(() => []);
      if (pts[0]) {
        const current = pts[0].total_points || 0;
        await base44.entities.UserPoints.update(pts[0].id, { total_points: current + analysis.strength_boost });
      }
    }

    return Response.json({ success: true, analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});