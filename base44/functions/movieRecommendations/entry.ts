import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// AI movie-title suggestions for the Discover page (public). The caller
// only supplies genre/mood lists; the prompt is fixed server-side.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const genres = Array.isArray(body?.genres) ? body.genres.join(', ') : '';
    const moods = Array.isArray(body?.moods) ? body.moods.join(', ') : '';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Suggest 8 real, well-known movie titles a viewer would enjoy based on these preferences. Favorite genres: ${genres || 'not set'}. Preferred moods: ${moods || 'not set'}. Return ONLY a JSON object with a "titles" array of title strings, no explanation.`,
      response_json_schema: { type: 'object', properties: { titles: { type: 'array', items: { type: 'string' } } }, required: ['titles'] },
      model: 'gpt_5_mini',
    });
    return Response.json({ titles: res?.titles || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}