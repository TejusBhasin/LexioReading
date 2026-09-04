import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// The secret easter-egg page's two fixed AI generators (jokes and a book
// idea). No user-controlled prompt — only the action is chosen.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body?.action === 'jokes') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate 10 short, clever, and funny book/reading-related jokes. Mix puns, observational humor, and nerdy bookworm humor. Keep each joke to 1-2 sentences max. Make them fresh and original.`,
        response_json_schema: {
          type: 'object',
          properties: {
            jokes: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      return Response.json({ jokes: result?.jokes || [] });
    }

    if (body?.action === 'book_idea') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate a wildly creative, funny, and original book idea. Make it epic but completely absurd and unexpected.
Include: a dramatic title, a one-sentence plot twist description, and a movie-trailer-style tagline.
Be creative, hilarious, and surprising. Think "Pride and Prejudice and Zombies" meets "The Hitchhiker's Guide to the Galaxy".`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            plot: { type: 'string' },
            tagline: { type: 'string' },
          },
        },
      });
      return Response.json(result || {});
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}