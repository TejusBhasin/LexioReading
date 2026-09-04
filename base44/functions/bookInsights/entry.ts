import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// Book-detail AI features (public page): spoiler-free summary, age/Lexile
// info, and similar-book suggestions. The prompts are fixed server-side —
// the caller only supplies a book title/author/description.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, title, author, description } = body || {};
    if (!title || !author) return Response.json({ error: 'title and author are required' }, { status: 400 });

    if (action === 'summary') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Write a compelling, spoiler-free 3-sentence summary of "${title}" by ${author}.

CRITICAL RULES — this is for a reading app used by students:
- Do NOT reveal any plot points, twists, character arcs, deaths, or endings.
- Do NOT summarize what happens in the story or retell any events.
- Write like a back-cover blurb: describe the premise, tone, and who would enjoy it.
- Tease the book's appeal WITHOUT giving away what actually happens.
Make it feel like a knowledgeable friend recommending it — enthusiastic but honest.

Also write one "hook line" (max 15 words) that captures the book's essence without spoiling anything.

Context: ${description?.slice(0, 500) || 'No description available'}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            hook: { type: 'string' },
          },
        },
      });
      return Response.json(result || {});
    }

    if (action === 'age_info') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `For the book "${title}" by ${author}, provide:
1. recommended_age: the minimum recommended age (e.g. "12+", "14+", "16+", "18+", "All ages")
2. lexile_level: the approximate Lexile reading level as a number (e.g. 800 for typical 7th grade)
3. lexile_label: a short label like "GN730L" or "800L" or an approximate range
4. content_notes: very brief note on any mature content (e.g. "mild violence", "clean", "some adult themes")
Use your knowledge of this book.`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommended_age: { type: 'string' },
            lexile_level: { type: 'number' },
            lexile_label: { type: 'string' },
            content_notes: { type: 'string' },
          },
        },
      });
      return Response.json(result || {});
    }

    if (action === 'similar') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `List exactly 5 books that are very similar to "${title}" by ${author}.
These should be books for the same audience and genre. Do NOT include the original book.
Return a JSON object with a "books" array, each item having "title" and "author" fields.`,
        response_json_schema: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  author: { type: 'string' },
                },
              },
            },
          },
        },
      });
      return Response.json({ books: result?.books || [] });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}