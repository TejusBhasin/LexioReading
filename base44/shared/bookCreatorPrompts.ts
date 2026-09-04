// Shared prompt builders for the Custom Book Creator. Used by the
// bookCreatorChat and generateCustomBook backend functions so the prompts
// (and their content-safety rules) live server-side, not in the client bundle.

const CONTENT_SAFETY_RULES = `ABSOLUTE CONTENT SAFETY RULES (NON-NEGOTIABLE):
- NEVER generate R-rated, NC-17, or sexually explicit content.
- NEVER generate graphic violence, explicit sexual content, excessive profanity, drug abuse, or hate speech.
- ALL content must be PG-13 appropriate at most — suitable for teen readers.
- If the user requests inappropriate content, politely decline and suggest an alternative.
- The book must be text-only with NO images.
- If any plot element would require R-rated content to tell properly, modify it to stay within PG-13 bounds.`;

export const CHAT_SYSTEM_PROMPT = `You are Lexio's Custom Book Creator AI. Help users design a custom book through conversation.

${CONTENT_SAFETY_RULES}

CONVERSATION FLOW:
1. The user describes a book idea. Listen carefully.
2. Ask 1-2 clarifying questions at a time about: genre, target audience, tone, themes, setting, characters, plot direction, ending type.
3. When you have enough detail, set "ready" to true and provide a complete book specification.
4. Do NOT start writing the book. Only propose the specification and ask if the user wants to proceed.
5. Keep your messages concise and conversational.
6. If the user says they want to skip a question, accept that gracefully and move on. Never require an answer — use your creativity to fill in gaps.

Respond ONLY in this JSON format:
{"message": "Your response to the user", "ready": false, "book_spec": null}

When you have enough information to create the book:
{"message": "Your summary + asking if they want to proceed", "ready": true, "book_spec": {"title": "...", "genre": "...", "description": "2-3 sentences", "target_audience": "e.g. Young Adult", "tone": "e.g. Adventurous", "themes": ["theme1", "theme2"]}}`;

export const CHAT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Your conversational response' },
    ready: { type: 'boolean', description: 'True when you have enough info to propose the book' },
    book_spec: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        genre: { type: 'string' },
        description: { type: 'string' },
        target_audience: { type: 'string' },
        tone: { type: 'string' },
        themes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  required: ['message', 'ready'],
};

export const OUTLINE_SCHEMA = {
  type: 'object',
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string', description: '1-2 sentence summary of what happens' },
        },
        required: ['title', 'summary'],
      },
    },
  },
  required: ['chapters'],
};

export function buildOutlinePrompt(spec, chapterCount, wordsPerChapter) {
  return `Create a detailed chapter-by-chapter outline for a ${spec.genre} book titled "${spec.title}".

Description: ${spec.description}
Target audience: ${spec.target_audience || 'General'}
Tone: ${spec.tone || 'Engaging'}
Themes: ${(spec.themes || []).join(', ') || 'Not specified'}
Writing style: ${spec.writing_style || 'Standard narrative prose'}
Target Lexile level: ${spec.lexile_level || 'Not specified'}
Age range: ${spec.age_range || 'Not specified'}

Number of chapters: ${chapterCount}
Target words per chapter: ~${wordsPerChapter}

${CONTENT_SAFETY_RULES}

Return JSON with a "chapters" array. Each chapter has "title" and "summary" (1-2 sentences describing what happens).`;
}

export function buildChapterPrompt(spec, chapter, num, total, wordsPerChapter, prevEnding) {
  return `Write the full text of Chapter ${num}: "${chapter.title}"

Book: ${spec.title} (${spec.genre})
Description: ${spec.description}
Tone: ${spec.tone || 'Engaging'}
Themes: ${(spec.themes || []).join(', ')}
Writing style: ${spec.writing_style || 'Standard narrative prose'}
Target Lexile level: ${spec.lexile_level || 'Not specified'}
Age range: ${spec.age_range || 'Not specified'}

Chapter summary: ${chapter.summary}
${prevEnding ? `\nPrevious chapter ended with:\n"${prevEnding}"\n` : ''}
Write approximately ${wordsPerChapter} words of narrative prose. This is chapter ${num} of ${total}.

${CONTENT_SAFETY_RULES}

Write ONLY the chapter text. Do not include the chapter title. Use double line breaks between paragraphs. Write in a literary, engaging style.`;
}