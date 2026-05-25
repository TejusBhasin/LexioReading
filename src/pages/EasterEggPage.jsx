import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const BOOK_JOKES = [
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Why did the book join the gym? To get well-read.",
  "A book fell on my head. I only have my shelf to blame.",
  "I told my wife she should embrace her mistakes. She hugged me.",
  "Why don't books win at poker? They always show their spine.",
  "My reading list is so long, by the time I finish it, books will read themselves.",
  "What do you call a book club stuck on the same novel for 3 years? A cult.",
  "Why was the math book sad? Too many problems.",
  "I tried to write a joke about books. Still working on the punchline.",
  "What's the difference between a cat and a comma? One has claws at the end of its paws, the other is a pause at the end of a clause.",
  "Why do books make terrible comedians? Their delivery is always flat.",
  "I asked the library if they had books about paranoia. The librarian whispered: 'They're right behind you.'",
];

const CLASSIFIED_STATS = [
  { label: 'Books added to Lexio libraries', value: '12,847', icon: '📚' },
  { label: 'Reading sessions logged', value: '3,291', icon: '⏱️' },
  { label: 'Reviews written', value: '847', icon: '⭐' },
  { label: 'Most saved book on Lexio', value: 'Fourth Wing', icon: '🏆' },
  { label: 'Avg reading streak before breaking it', value: '4 days', icon: '🔥' },
  { label: 'Books on wishlists never started', value: '9,241', icon: '😬' },
  { label: 'AI recommendations generated', value: '2,103', icon: '🤖' },
  { label: 'Probability you finish your TBR pile', value: '0.003%', icon: '😅' },
  { label: 'Coffee cups consumed while reading (est.)', value: '∞', icon: '☕' },
  { label: 'Pages turned across all users', value: '1,247,393', icon: '📄' },
];

const FUN_FACTS = [
  "The fear of running out of books to read is called 'abibliophobia'. You probably have it.",
  "On average, people read 12 books/year. The average Lexio user reads 47. (we made this up, but it sounds right.)",
  "The longest novel ever written has 9,609,000 characters. Still shorter than your TBR pile.",
  "Reading for 6 minutes reduces stress by 68%. You've been on this page for at least that long.",
  "Shakespeare invented over 1,700 words. None of them were 'unread notifications'.",
  "There are 130 million books in existence. You will read approximately 0.000004% of them. No pressure.",
  "The first book ever printed was the Gutenberg Bible in 1455. It was not a YA romance novel.",
  "Bibliotherapy is a real form of therapy using books to heal emotional problems. Lexio is basically a hospital.",
];

const TYPING_TEXT = '> LEXIO_SECRET_TERMINAL v0.0.1 — UNAUTHORIZED ACCESS DETECTED';

export default function EasterEggPage() {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [cursor, setCursor] = useState(true);
  const [jokeIdx, setJokeIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [bookIdea, setBookIdea] = useState(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(TYPING_TEXT.slice(0, i + 1));
      i++;
      if (i >= TYPING_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => setRevealed(true), 400);
      }
    }, 28);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(blink);
  }, []);

  async function generateBookIdea() {
    setGenerating(true);
    setBookIdea(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a wildly creative, funny, and original book idea. Make it epic but completely absurd and unexpected.
Include: a dramatic title, a one-sentence plot twist description, and a movie-trailer-style tagline.
Be creative, hilarious, and surprising. Think "Pride and Prejudice and Zombies" meets "The Hitchhiker's Guide to the Galaxy".`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            plot: { type: 'string' },
            tagline: { type: 'string' },
          }
        }
      });
      setBookIdea(result);
    } catch (e) {}
    setGenerating(false);
  }

  const green = '#00ff41';
  const dimGreen = '#00aa2a';
  const faintGreen = '#005510';
  const bg = '#030a03';

  return (
    <div className="min-h-screen px-4 py-8 pb-24 md:pb-8" style={{ background: bg, color: green, fontFamily: "'Courier New', Courier, monospace", position: 'relative', overflowX: 'hidden' }}>
      {/* CRT Scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
      }} />
      {/* CRT vignette */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)',
      }} />

      <div className="max-w-3xl mx-auto relative" style={{ zIndex: 2 }}>
        {/* Boot sequence */}
        <div className="mb-8 text-xs" style={{ color: faintGreen }}>
          <div>{'>'} INITIALIZING LEXIO_CORE...</div>
          <div>{'>'} BYPASSING AUTHENTICATION... OK</div>
          <div>{'>'} LOADING SECRET_ARCHIVES... OK</div>
          <div className="mt-3 text-sm font-bold" style={{ color: green }}>
            {typed}{cursor ? '█' : '\u00A0'}
          </div>
        </div>

        {revealed && (
          <div className="space-y-10 fade-in">
            {/* Welcome banner */}
            <div className="p-5 border" style={{ borderColor: `${green}40`, background: `${green}08` }}>
              <div className="text-xs mb-1" style={{ color: dimGreen }}>{'>'} STATUS: CLASSIFIED | CLEARANCE LEVEL: SUPER SECRET BOOKWORM</div>
              <div className="text-xl font-bold mb-2">🕵️ WELCOME TO THE LEXIO SECRET ARCHIVES 🕵️</div>
              <div className="text-sm" style={{ color: dimGreen }}>
                This page does not officially exist. You did not read this. If anyone asks, you were just looking at the terms and conditions.
              </div>
            </div>

            {/* Classified Stats */}
            <div className="border p-5" style={{ borderColor: `${green}30`, background: `${green}05` }}>
              <div className="text-xs mb-3" style={{ color: faintGreen }}>{'>'} MODULE: CLASSIFIED_STATS.db — TOP SECRET</div>
              <div className="text-lg font-bold mb-4">📊 LEXIO CLASSIFIED STATISTICS</div>
              <div className="space-y-0">
                {CLASSIFIED_STATS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: `1px solid ${green}15` }}>
                    <span style={{ color: dimGreen }}>{s.icon} {s.label}</span>
                    <span className="font-bold ml-4 flex-shrink-0" style={{ color: green }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs mt-3" style={{ color: faintGreen }}>
                * some figures are approximate. or completely fabricated. we'll never say which.
              </div>
            </div>

            {/* Joke Machine */}
            <div className="border p-5" style={{ borderColor: `${green}30`, background: `${green}05` }}>
              <div className="text-xs mb-3" style={{ color: faintGreen }}>{'>'} MODULE: JOKE_DATABASE.exe — {BOOK_JOKES.length} ENTRIES LOADED</div>
              <div className="text-lg font-bold mb-3">📖 BOOK JOKE #{jokeIdx + 1} / {BOOK_JOKES.length}</div>
              <div className="text-base mb-5 italic" style={{ color: green, minHeight: '3rem' }}>
                "{BOOK_JOKES[jokeIdx]}"
              </div>
              <button
                onClick={() => setJokeIdx(i => (i + 1) % BOOK_JOKES.length)}
                className="text-xs px-5 py-2 border transition-all hover:opacity-70"
                style={{ borderColor: green, color: green, background: 'transparent' }}
              >
                [LOAD NEXT JOKE]
              </button>
            </div>

            {/* AI Book Idea Generator */}
            <div className="border p-5" style={{ borderColor: `${green}30`, background: `${green}05` }}>
              <div className="text-xs mb-3" style={{ color: faintGreen }}>{'>'} MODULE: BOOK_IDEA_GEN_9000.ai — EXPERIMENTAL</div>
              <div className="text-lg font-bold mb-1">💡 EXPERIMENTAL BOOK IDEA GENERATOR</div>
              <div className="text-xs mb-4" style={{ color: dimGreen }}>
                Generate a book idea so unhinged, even the AI is surprised by itself.
              </div>
              <button
                onClick={generateBookIdea}
                disabled={generating}
                className="text-sm px-6 py-2.5 border font-bold transition-all mb-4"
                style={{
                  borderColor: generating ? faintGreen : green,
                  color: generating ? faintGreen : green,
                  background: 'transparent',
                  cursor: generating ? 'wait' : 'pointer',
                }}
              >
                {generating ? '> NEURAL NETWORK OVERHEATING...' : '> GENERATE BOOK IDEA'}
              </button>
              {bookIdea && (
                <div className="p-4 border mt-2" style={{ borderColor: `${green}60`, background: `${green}12` }}>
                  <div className="text-xl font-bold mb-2">{bookIdea.title}</div>
                  <div className="text-sm mb-3" style={{ color: dimGreen }}>{'>'} PLOT: {bookIdea.plot}</div>
                  <div className="text-xs italic" style={{ color: faintGreen }}>
                    TAGLINE: "{bookIdea.tagline}"
                  </div>
                  <button onClick={generateBookIdea} disabled={generating}
                    className="text-xs mt-3 px-3 py-1 border transition-all hover:opacity-70"
                    style={{ borderColor: `${green}40`, color: dimGreen, background: 'transparent' }}>
                    [GENERATE ANOTHER]
                  </button>
                </div>
              )}
            </div>

            {/* Fun Facts */}
            <div className="border p-5" style={{ borderColor: `${green}30`, background: `${green}05` }}>
              <div className="text-xs mb-3" style={{ color: faintGreen }}>{'>'} MODULE: BOOK_NERD_FACTS.txt</div>
              <div className="text-lg font-bold mb-4">🧠 CLASSIFIED BOOK NERD FACTS</div>
              <div className="space-y-0 text-sm">
                {FUN_FACTS.map((fact, i) => (
                  <div key={i} className="py-2.5" style={{ borderBottom: `1px solid ${green}15`, color: dimGreen }}>
                    {'>'} {fact}
                  </div>
                ))}
              </div>
            </div>

            {/* The Oath */}
            <div className="border p-5 text-center" style={{ borderColor: `${green}30`, background: `${green}05` }}>
              <div className="text-xs mb-3" style={{ color: faintGreen }}>{'>'} MANDATORY_OATH.txt</div>
              <div className="text-sm font-bold mb-3">📜 THE READER'S OATH OF SECRECY</div>
              <div className="text-xs space-y-1" style={{ color: dimGreen }}>
                <div>I solemnly swear that I found this page entirely by accident.</div>
                <div>I will not tell anyone about it. (Please tell everyone.)</div>
                <div>I acknowledge that my TBR pile is out of control and always will be.</div>
                <div>I accept that "just one more chapter" is a blatant lie I tell myself.</div>
                <div>I pledge to judge books by their cover at least occasionally.</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center py-4">
              <div className="text-xs mb-4" style={{ color: faintGreen }}>
                ████ THIS PAGE IS CLASSIFIED ████ DO NOT SCREENSHOT ████ (please do, it took forever) ████
              </div>
              <a href="/discover" className="text-sm underline" style={{ color: dimGreen }}>
                {'>'} [ESC] RETURN TO REALITY
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}