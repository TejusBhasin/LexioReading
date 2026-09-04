import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// Powers the Discover page's "Because you liked X" row: exactly two similar
// books with reasons, from a fixed server-side prompt.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { title, author } = body || {};
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Recommend exactly 2 books that are genuinely similar to "${title}"${author ? ` by ${author}` : ''}. These should be books that a reader who enjoyed the seed book would love. Consider similar themes, writing style, genre, and tone. Return the exact title and author for each.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                author: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });
    return Response.json({ recommendations: res?.recommendations || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}