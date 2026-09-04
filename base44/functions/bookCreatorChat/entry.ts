import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';
import { CHAT_SYSTEM_PROMPT, CHAT_RESPONSE_SCHEMA } from '../../shared/bookCreatorPrompts.ts';

// The Custom Book Creator's design chat (public page). The system prompt and
// response schema live server-side; the caller only supplies the conversation.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { genre, style, history } = body || {};
    if (!Array.isArray(history) || history.length === 0) {
      return Response.json({ error: 'history is required' }, { status: 400 });
    }

    const genreLine = genre ? `\n\nThe user has already selected the genre: ${genre}. Use this as the book's genre unless the user explicitly asks to change it.` : '';
    const styleLine = style ? `\n\nThe user has already selected the writing style: ${style}. Use this as the book's writing style unless the user explicitly asks to change it.` : '';
    const historyStr = history
      .slice(-30)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${CHAT_SYSTEM_PROMPT}${genreLine}${styleLine}\n\nConversation so far:\n${historyStr}\n\nAssistant:`,
      response_json_schema: CHAT_RESPONSE_SCHEMA,
    });
    return Response.json(result || {});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}