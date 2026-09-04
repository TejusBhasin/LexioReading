import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sameOriginGuard } from '../../shared/sameOrigin.ts';

// The Librarian Mode kiosk chat. The kiosk runs on the app's own frontend but
// may be used anonymously, so this endpoint keeps the fixed kiosk prompt
// server-side behind the same-origin guard.
export default async function (req) {
  try {
    const guard = sameOriginGuard(req);
    if (guard) return guard;
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const text = (body?.message || '').trim();
    if (!text) return Response.json({ error: 'message is required' }, { status: 400 });

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Lexio Librarian, a friendly AI assistant at a library kiosk. A visitor walked up and asked: "${text}"

Your rules:
1. Help visitors find books, learn about authors, explore genres, and discover new reads.
2. When recommending books, format as: **Title** by Author — brief reason.
3. Keep responses friendly, concise, and under 200 words.
4. If asked about something unrelated to books, kindly redirect to reading and books.
5. You are in a public kiosk setting — keep all content appropriate for all ages.`,
      model: 'claude_sonnet_4_6',
    });
    return Response.json({ reply: typeof response === 'string' ? response : response?.text || 'Let me help you find something great to read!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}