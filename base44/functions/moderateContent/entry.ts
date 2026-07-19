import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENTITY_TYPES = ['Review', 'Discussion', 'ForumPost', 'ForumComment', 'ChainMessage', 'ClubPost', 'ClubPostReply'];
const CONTENT_FIELDS = ['content', 'title', 'message', 'body', 'text', 'progress_note', 'reflection'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only.' }, { status: 403 });

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    let checked = 0;
    let deleted = 0;

    for (const entityName of ENTITY_TYPES) {
      try {
        const recent = await base44.asServiceRole.entities[entityName].filter({}, '-created_date', 20);

        for (const item of recent) {
          if (new Date(item.created_date).getTime() < oneHourAgo) break;

          const content = CONTENT_FIELDS
            .map(f => item[f])
            .filter(Boolean)
            .join(' ')
            .trim();

          if (!content || content.length < 3) continue;
          checked++;

          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are a strict content moderator for a teen reading app (age 13+). Review this user-submitted content and determine if it is appropriate.

Flag as UNSAFE if it contains ANY of:
- Explicit sexual content or nudity
- Graphic violence or gore
- Hate speech, racism, or discrimination
- Bullying, threats, or harassment
- Self-harm or suicide encouragement
- Drug/alcohol promotion
- Extreme profanity or slurs
- Predatory or grooming language
- Personal information of minors

Content to review: "${content.slice(0, 1500)}"

Respond with valid JSON only: {"safe": true or false, "reason": "one sentence if unsafe, else empty string"}`,
            response_json_schema: {
              type: "object",
              properties: {
                safe: { type: "boolean" },
                reason: { type: "string" }
              },
              required: ["safe"]
            }
          });

          if (result?.safe === false) {
            await base44.asServiceRole.entities[entityName].delete(item.id);
            deleted++;
            console.log(`[SafetyBot] Deleted unsafe ${entityName} (${item.id}). Reason: ${result.reason}`);
          }
        }
      } catch (e) {
        console.error(`[SafetyBot] Error scanning ${entityName}:`, e.message);
      }
    }

    console.log(`[SafetyBot] Hourly scan complete. Checked: ${checked}, Deleted: ${deleted}`);
    return Response.json({ ok: true, checked, deleted });
  } catch (error) {
    console.error('[SafetyBot] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});