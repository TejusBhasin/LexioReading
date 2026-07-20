import { jsPDF } from 'jspdf';
import { downloadBlob } from '@/lib/epubBuilder';

// === CONTENT SAFETY ===
export const CONTENT_SAFETY_RULES = `ABSOLUTE CONTENT SAFETY RULES (NON-NEGOTIABLE):
- NEVER generate R-rated, NC-17, or sexually explicit content.
- NEVER generate graphic violence, explicit sexual content, excessive profanity, drug abuse, or hate speech.
- ALL content must be PG-13 appropriate at most — suitable for teen readers.
- If the user requests inappropriate content, politely decline and suggest an alternative.
- The book must be text-only with NO images.
- If any plot element would require R-rated content to tell properly, modify it to stay within PG-13 bounds.`;

// === CHAT PROMPT ===
export const CHAT_SYSTEM_PROMPT = `You are Lexio's Custom Book Creator AI. Help users design a custom book through conversation.

${CONTENT_SAFETY_RULES}

CONVERSATION FLOW:
1. The user describes a book idea. Listen carefully.
2. Ask 1-2 clarifying questions at a time about: genre, target audience, tone, themes, setting, characters, plot direction, ending type.
3. When you have enough detail, set "ready" to true and provide a complete book specification.
4. Do NOT start writing the book. Only propose the specification and ask if the user wants to proceed.
5. Keep your messages concise and conversational.

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

Chapter summary: ${chapter.summary}
${prevEnding ? `\nPrevious chapter ended with:\n"${prevEnding}"\n` : ''}
Write approximately ${wordsPerChapter} words of narrative prose. This is chapter ${num} of ${total}.

${CONTENT_SAFETY_RULES}

Write ONLY the chapter text. Do not include the chapter title. Use double line breaks between paragraphs. Write in a literary, engaging style.`;
}

export function calcChapterCount(pageCount) {
  const totalWords = pageCount * 280;
  return Math.max(5, Math.min(25, Math.round(totalWords / 2500)));
}

export async function downloadPdf(title, author, chapters, includeToc = false) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxW = pw - margin * 2;
  let pageCounter = 1;

  // Title page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, pw / 2, ph / 2 - 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`by ${author}`, pw / 2, ph / 2 + 15, { align: 'center' });

  // Reserve TOC page
  let tocPageNum = 0;
  if (includeToc) {
    doc.addPage();
    pageCounter++;
    tocPageNum = pageCounter;
  }

  // Chapters
  const chapterStartPages = [];
  for (const ch of chapters) {
    doc.addPage();
    pageCounter++;
    chapterStartPages.push(pageCounter);
    let y = margin + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const chLines = doc.splitTextToSize(ch.title, maxW);
    doc.text(chLines, pw / 2, y, { align: 'center' });
    y += chLines.length * 8 + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const paragraphs = ch.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, maxW);
      for (const line of lines) {
        if (y > ph - margin) {
          doc.addPage();
          pageCounter++;
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      }
      y += 4;
    }
  }

  // Fill in TOC page with clickable links to chapter starts
  if (includeToc && tocPageNum > 0) {
    doc.setPage(tocPageNum);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Table of Contents', pw / 2, margin + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    let y = margin + 30;
    chapters.forEach((ch, i) => {
      const text = `Chapter ${i + 1}: ${ch.title}`;
      const lines = doc.splitTextToSize(text, maxW - 15);
      for (const line of lines) {
        doc.textWithLink(line, margin, y, { pageNumber: chapterStartPages[i] });
        y += 7;
      }
      y += 3;
    });
  }

  const pdfBlob = doc.output('blob');
  await downloadBlob(pdfBlob, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function countWords(chapters) {
  return chapters.reduce((sum, ch) => sum + ch.content.split(/\s+/).filter(Boolean).length, 0);
}