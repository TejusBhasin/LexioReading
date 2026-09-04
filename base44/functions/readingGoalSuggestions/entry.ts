import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// AI-suggested reading goals for a logged-in reader. Fixed prompt; the
// caller only supplies how many books they've finished this year.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const finished = Number(body?.finished_count) || 0;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate 5 personalized, motivating reading goals for a reader who has finished ${finished} books this year. Make them specific, achievable, and inspiring. Mix genre goals, habit goals, and social goals.`,
      response_json_schema: { type: 'object', properties: { goals: { type: 'array', items: { type: 'string' } } } },
    });
    return Response.json({ goals: result?.goals || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}