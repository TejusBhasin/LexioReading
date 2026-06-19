import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // This function is called by internal automations only.
    // Validate via a shared secret header to prevent unauthorized access.
    const authHeader = req.headers.get('x-automation-secret');
    const expectedSecret = Deno.env.get('AUTOMATION_SECRET');
    if (!expectedSecret || authHeader !== expectedSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (!data) return Response.json({ ok: true, skipped: 'no data' });

    const entityName = event?.entity_name;
    const entityId = event?.entity_id;

    // Build the content string to check
    const content = [data.content, data.title, data.progress_note, data.reflection]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!content || content.length < 3) return Response.json({ ok: true, skipped: 'no content' });

    // Check with AI moderation
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
      // Auto-delete the entity record
      await base44.asServiceRole.entities[entityName].delete(entityId);
      console.log(`[SafetyBot] Deleted unsafe ${entityName} (${entityId}). Reason: ${result.reason}`);
    }

    return Response.json({ ok: true, safe: result?.safe ?? true });
  } catch (error) {
    console.error('[SafetyBot] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});