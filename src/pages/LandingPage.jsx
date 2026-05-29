import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const TABS = ['Features', 'About', 'Contact Us'];

const FEATURES = [
  {
    title: 'Reading Library',
    desc: 'Every book you\'ve ever read, are reading, or plan to read — organized in one place. Add star ratings, personal notes, tags, and track your current page. Your entire reading history, beautifully catalogued.',
    emoji: '📚',
    color: '#1a3a2a',
    accent: '#4ade80',
  },
  {
    title: 'Daily Streaks & Points',
    desc: 'Build an unbreakable reading habit with a Duolingo-style streak system. Earn points for logging sessions, writing reviews, and finishing books. Buy streak freezes to protect your progress. Compete on the global leaderboard.',
    emoji: '🔥',
    color: '#3a1a0a',
    accent: '#fb923c',
  },
  {
    title: 'Reading Clubs',
    desc: 'Four distinct club types — Discussion, Administrative, Collaborative, and Logging — for every kind of group. Teachers track student progress. Friends read together. Book clubs discuss chapter by chapter. Each club is built for its purpose.',
    emoji: '👥',
    color: '#1a1a3a',
    accent: '#818cf8',
  },
  {
    title: 'AI Book Companion',
    desc: 'A personal AI that knows your reading history and preferences. Ask for recommendations, discuss plot twists, get reading plans, or just chat about books. The more you read, the smarter it gets about what you\'ll love.',
    emoji: '🤖',
    color: '#2a1a3a',
    accent: '#c084fc',
  },
  {
    title: 'Reviews & Forums',
    desc: 'Write detailed reviews with star ratings and share them with the community. Explore forums where readers debate, recommend, and connect. Vote on posts, reply to threads, and filter by topic tags.',
    emoji: '⭐',
    color: '#3a2a0a',
    accent: '#fbbf24',
  },
  {
    title: 'Reading Goals & Strength',
    desc: 'Set annual book and page targets, then track every milestone. The Reading Strength dashboard shows your consistency score, reading velocity, genre diversity, and streak history — with beautiful charts.',
    emoji: '🎯',
    color: '#0a2a2a',
    accent: '#2dd4bf',
  },
  {
    title: 'Challenges & Bingo',
    desc: 'AI-generated 5×5 reading bingo boards with fresh challenges every time. Complete squares, unlock bonus achievements, and compete with others. Every board is unique and tailored to your reading level.',
    emoji: '🏆',
    color: '#2a0a1a',
    accent: '#f472b6',
  },
  {
    title: 'School Mode',
    desc: 'Teachers create schools, invite students with a join code, and get a full admin dashboard showing every student\'s reading logs, time spent, and books completed. Lock themes, restrict features, and run a real reading program.',
    emoji: '🎓',
    color: '#1a2a0a',
    accent: '#a3e635',
  },
];

function FeatureGraphic({ emoji, color, accent }) {
  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl flex items-center justify-center overflow-hidden"
      style={{ background: color, border: `1px solid ${accent}22` }}>
      {/* decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-48 h-48 rounded-full opacity-10" style={{ border: `2px solid ${accent}` }} />
        <div className="absolute w-32 h-32 rounded-full opacity-20" style={{ border: `2px solid ${accent}` }} />
        <div className="absolute w-64 h-64 rounded-full opacity-5" style={{ border: `2px solid ${accent}` }} />
      </div>
      {/* corner dots */}
      <div className="absolute top-4 left-4 w-2 h-2 rounded-full" style={{ background: accent, opacity: 0.4 }} />
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: accent, opacity: 0.4 }} />
      <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full" style={{ background: accent, opacity: 0.4 }} />
      <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full" style={{ background: accent, opacity: 0.4 }} />
      {/* accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      {/* main emoji */}
      <div className="relative text-7xl select-none" style={{ filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.2))' }}>
        {emoji}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [tab, setTab] = useState('Features');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleContact(e) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'Support@LexioReading.App',
        subject: `Contact from ${contactForm.name}`,
        body: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`,
      });
      setContactSent(true);
    } catch (e) {}
    setSending(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505', color: '#f0ebe0', fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{ borderBottom: '1px solid #1c1c1c', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio" style={{ height: 36, width: 36, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px', color: '#f5a623' }}>Lexio</span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t ? '#f5a623' : 'transparent',
                color: tab === t ? '#050505' : '#888',
                border: 'none',
              }}>
                {t}
              </button>
            ))}
          </nav>

          {/* Sign In */}
          <button onClick={() => base44.auth.redirectToLogin()} style={{
            padding: '9px 22px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer',
            background: '#f5a623', color: '#050505', border: 'none', letterSpacing: '-0.2px',
          }}>
            Sign In →
          </button>
        </div>
      </header>

      {/* ── HERO (always visible above tabs) ── */}
      <section style={{ textAlign: 'center', padding: '72px 24px 56px', borderBottom: '1px solid #1c1c1c', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,166,35,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 28, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623', letterSpacing: '0.5px' }}>
            FREE FOREVER · NO CREDIT CARD
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 24 }}>
            Read more.<br />
            <span style={{ color: '#f5a623' }}>Track everything.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#888', marginBottom: 36, lineHeight: 1.7 }}>
            Lexio is the reading companion built for people who take books seriously.
            Library tracking, streaks, clubs, AI chat, and more — all free.
          </p>
          <button onClick={() => base44.auth.redirectToLogin()} style={{
            padding: '16px 40px', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: 'pointer',
            background: '#f5a623', color: '#050505', border: 'none', letterSpacing: '-0.3px',
            boxShadow: '0 0 50px rgba(245,166,35,0.25)',
          }}>
            Create Free Account
          </button>
        </div>
      </section>

      <main style={{ flex: 1 }}>

        {/* ── FEATURES ── */}
        {tab === 'Features' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>
              Everything you need to <span style={{ color: '#f5a623' }}>read better.</span>
            </h2>
            <p style={{ color: '#666', marginBottom: 56, fontSize: 16 }}>Every feature built with one purpose — to make reading more rewarding.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                  borderTop: '1px solid #1c1c1c',
                  padding: '40px 0',
                }}>
                  {/* Left: text */}
                  <div style={{ paddingRight: 48 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#f5a623', marginBottom: 12 }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 16 }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75 }}>
                      {f.desc}
                    </p>
                  </div>
                  {/* Right: graphic */}
                  <div style={{ paddingLeft: 48 }}>
                    <FeatureGraphic emoji={f.emoji} color={f.color} accent={f.accent} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 56, textAlign: 'center' }}>
              <button onClick={() => base44.auth.redirectToLogin()} style={{
                padding: '16px 44px', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: 'pointer',
                background: '#f5a623', color: '#050505', border: 'none',
              }}>
                Start Using All Features Free →
              </button>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab === 'About' && (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', marginBottom: 40 }}>
              About <span style={{ color: '#f5a623' }}>Lexio.</span>
            </h2>

            {[
              { title: 'What is Lexio?', body: 'Lexio is a free reading companion app built for people who love books. We wanted to create the tool we wished existed — powerful enough for serious readers, simple enough for anyone.' },
              { title: 'Our Mission', body: 'To make reading trackable, social, and rewarding — for everyone, at no cost. We are committed to keeping all core features free forever. No subscriptions, no paywalls, no tricks.' },
              { title: 'Who is it for?', body: 'Casual readers who want to track their shelf. Power readers who log every session. Students in classrooms with School Mode. Book clubs reading together. Anyone who believes books matter.' },
              { title: 'Privacy & Data', body: 'We collect only what is needed to run the app. We never sell your data. You control your profile visibility, and you can delete everything at any time. Your reading life belongs to you.' },
              { title: 'Free Forever', body: 'Lexio was built on the belief that reading tools should be accessible to everyone. Core features will always be free. If premium features are ever introduced, they will be clearly optional and transparent.' },
            ].map(({ title, body }) => (
              <div key={title} style={{ borderTop: '1px solid #1c1c1c', paddingTop: 32, paddingBottom: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#f5a623' }}>{title}</h3>
                <p style={{ fontSize: 16, color: '#888', lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 48, textAlign: 'center' }}>
              <button onClick={() => base44.auth.redirectToLogin()} style={{
                padding: '16px 44px', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: 'pointer',
                background: '#f5a623', color: '#050505', border: 'none',
              }}>
                Join Lexio Free →
              </button>
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {tab === 'Contact Us' && (
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px' }}>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', marginBottom: 12 }}>
              Say <span style={{ color: '#f5a623' }}>hello.</span>
            </h2>
            <p style={{ color: '#666', marginBottom: 40, fontSize: 16 }}>
              Questions, feedback, bug reports, or anything else — we read every message.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, marginBottom: 40, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <span style={{ fontSize: 18 }}>✉️</span>
              <a href="mailto:Support@LexioReading.App" style={{ color: '#f5a623', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                Support@LexioReading.App
              </a>
            </div>

            {contactSent ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 16, background: '#111', border: '1px solid #1c1c1c' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Message received!</h3>
                <p style={{ color: '#666' }}>We'll get back to you at {contactForm.email} soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'name', label: 'Your Name', type: 'text', placeholder: 'Jane Smith' },
                  { key: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8, letterSpacing: '0.5px' }}>{label.toUpperCase()}</label>
                    <input type={type} placeholder={placeholder}
                      value={contactForm[key]}
                      onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 10, fontSize: 15, outline: 'none', background: '#111', border: '1px solid #2a2a2a', color: '#f0ebe0', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8, letterSpacing: '0.5px' }}>MESSAGE</label>
                  <textarea rows={5} placeholder="What's on your mind?"
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 10, fontSize: 15, outline: 'none', background: '#111', border: '1px solid #2a2a2a', color: '#f0ebe0', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" disabled={sending || !contactForm.name || !contactForm.email || !contactForm.message}
                  style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: 'pointer', background: '#f5a623', color: '#050505', border: 'none', opacity: (sending || !contactForm.name || !contactForm.email || !contactForm.message) ? 0.4 : 1 }}>
                  {sending ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1c1c1c', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio" style={{ height: 24, width: 24, borderRadius: 6, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, color: '#f5a623' }}>Lexio</span>
        </div>
        <p style={{ fontSize: 12, color: '#444' }}>Free forever · Support@LexioReading.App</p>
      </footer>
    </div>
  );
}