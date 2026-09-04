import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Generates the reading-challenge bingo squares for a logged-in reader.
// The prompt is fixed server-side; the caller only supplies their stats.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const finished = Number(body?.finished_count) || 0;
    const genres = Array.isArray(body?.genres) ? body.genres.join(', ') : '';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate 25 fun, creative, and specific reading bingo challenge squares for a book reader.
User info: ${finished} books finished, reads genres: ${genres || 'various'}.
Make them diverse: some easy, some hard, some genre-specific, some general, some social.
Return ONLY a JSON array of 25 short strings (max 8 words each), no numbering. Example format:
["Read a book set in Asia", "Finish a book in one day", ...]`,
      response_json_schema: { type: 'object', properties: { squares: { type: 'array', items: { type: 'string' } } } },
    });
    return Response.json({ squares: result?.squares || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}