import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';
import { buildOutlinePrompt, buildChapterPrompt, OUTLINE_SCHEMA } from '../../shared/bookCreatorPrompts.ts';

// Custom Book Creator generation steps (public page). Two narrow actions —
// outline and one chapter — so the client can stream per-chapter progress
// while every generation prompt is built server-side.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, spec } = body || {};
    if (!spec || !spec.title) return Response.json({ error: 'spec is required' }, { status: 400 });

    if (action === 'outline') {
      const chapterCount = Number(body.chapter_count) || 5;
      const wordsPerChapter = Number(body.words_per_chapter) || 2500;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildOutlinePrompt(spec, chapterCount, wordsPerChapter),
        response_json_schema: OUTLINE_SCHEMA,
      });
      return Response.json({ chapters: result?.chapters || [] });
    }

    if (action === 'chapter') {
      const { chapter, num, total, words_per_chapter, prev_ending } = body || {};
      if (!chapter || !chapter.title || !chapter.summary) {
        return Response.json({ error: 'chapter is required' }, { status: 400 });
      }
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildChapterPrompt(spec, chapter, Number(num) || 1, Number(total) || 1, Number(words_per_chapter) || 2500, prev_ending || ''),
      });
      return Response.json({ text: typeof result === 'string' ? result : String(result) });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}