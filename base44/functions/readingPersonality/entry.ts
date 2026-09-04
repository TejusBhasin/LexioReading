import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Reading Wrapped's personality analysis for a logged-in reader. The caller
// supplies only their own reading stats; the prompt is fixed server-side.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const finished = Number(body?.finished) || 0;
    const topGenres = Array.isArray(body?.top_genres) ? body.top_genres.join(', ') : '';
    const totalLogs = Number(body?.total_logs) || 0;
    const reflections = Array.isArray(body?.reflections) ? body.reflections.join(' | ') : '';
    const year = Number(body?.year) || new Date().getFullYear();

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Based on this reader's ${year} stats, assign them a reading personality type:
Books finished: ${finished}
Top genres: ${topGenres}
Total reading sessions: ${totalLogs}
Sample reflections: ${reflections || 'none'}

Choose ONE from: explorer, deep_diver, emotionalist, thrill_seeker, dreamer
Also write a 2-sentence personalized reading personality summary.`,
      response_json_schema: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          summary: { type: 'string' },
        },
      },
    });
    return Response.json({ type: result?.type || '', summary: result?.summary || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}