import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// Serves the Dashboard's daily reading quote. A narrow, parameter-free
// operation: callers cannot steer the prompt, only trigger one fixed
// web-backed quote lookup per call.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const quote = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: "Find a famous and inspiring quote about reading, books, or literature from a real author. Use the web to find one. Return the exact quote text and the author's name. Pick something different from common quotes like \"So many books, so little time\" — find something more unique and thought-provoking.",
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The exact quote text' },
          author: { type: 'string', description: "The author's name" },
        },
        required: ['text', 'author'],
      },
    });
    return Response.json({ quote: quote || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}