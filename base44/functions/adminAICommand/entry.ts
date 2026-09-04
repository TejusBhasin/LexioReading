import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Parses a platform admin's plain-English moderation instruction into a
// structured restriction command. Platform admins only; the client applies
// the parsed command to UserSafeness (which is itself admin-gated by RLS).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const instruction = (body?.instruction || '').trim();
    if (!instruction) return Response.json({ error: 'instruction is required' }, { status: 400 });

    const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an admin assistant for Lexio, a reading app. Parse the admin's natural language instruction about restricting or managing a user.

Available feature restriction keys (use these EXACT strings):
- banned_from_forums: ban from forums
- banned_from_clubs: ban from clubs / reading clubs
- banned_from_comments: ban from comments
- banned_from_discussions: ban from discussions
- banned_from_chat: ban from AI chat

Actions:
- ban_feature: ban user from specific features (provide features array)
- full_ban: completely ban the user
- unban_feature: remove specific feature bans (provide features array)
- unban_all: remove all bans and restrictions
- warn: issue a warning (no ban)

Admin's instruction: "${instruction}"

Return the parsed result with the user's email (lowercase), the action, which features to ban/unban (if applicable), and a brief reason.`,
      response_json_schema: {
        type: 'object',
        properties: {
          user_email: { type: 'string', description: 'The email of the user to act on (lowercase)' },
          action: { type: 'string', enum: ['ban_feature', 'full_ban', 'unban_feature', 'unban_all', 'warn'] },
          features: { type: 'array', items: { type: 'string', enum: ['banned_from_forums', 'banned_from_clubs', 'banned_from_comments', 'banned_from_discussions', 'banned_from_chat'] } },
          reason: { type: 'string' },
        },
        required: ['user_email', 'action'],
      },
    });
    return Response.json(parsed || {});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}