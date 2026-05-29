import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const FEATURES = [
  { title: 'Reading Library', desc: 'Every book you\'ve read, are reading, or plan to read — organized beautifully. Add ratings, notes, tags, and track your current page.', emoji: '📚', color: '#1a3a2a', accent: '#4ade80' },
  { title: 'Daily Streaks & Points', desc: 'Build an unbreakable reading habit with a streak system. Earn points for logging sessions, writing reviews, and finishing books.', emoji: '🔥', color: '#3a1a0a', accent: '#fb923c' },
  { title: 'Reading Clubs', desc: 'Four club types for every group — Discussion, Administrative, Collaborative, and Logging. Teachers track students. Friends read together.', emoji: '👥', color: '#1a1a3a', accent: '#818cf8' },
  { title: 'AI Book Companion', desc: 'A personal AI that knows your reading history. Ask for recommendations, discuss plot twists, or get a custom reading plan.', emoji: '🤖', color: '#2a1a3a', accent: '#c084fc' },
  { title: 'Reviews & Forums', desc: 'Write detailed reviews, explore community forums, vote on posts, and connect with readers who share your taste.', emoji: '⭐', color: '#3a2a0a', accent: '#fbbf24' },
  { title: 'School Mode', desc: 'Teachers create schools, invite students with a join code, and get a full dashboard showing every student\'s reading progress.', emoji: '🎓', color: '#1a2a0a', accent: '#a3e635' },
  { title: 'Reading Goals & Challenges', desc: 'Set annual book targets, complete AI-generated bingo challenges, and track your reading strength with detailed analytics.', emoji: '🎯', color: '#0a2a2a', accent: '#2dd4bf' },
];

export default function LandingPage() {
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

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#050505', color: '#f0ebe0', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #1c1c1c', background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio" style={{ height: 32, width: 32, borderRadius: 8, objectFit: 'contain' }} />
            <span style={{ fontWeight: 900, fontSize: 20, color: '#f5a623' }}>Lexio</span>
          </div>

          <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[['features', 'Features'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: 'transparent', color: '#888', border: 'none', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => e.target.style.color = '#f0ebe0'}
                onMouseLeave={e => e.target.style.color = '#888'}
              >{label}</button>
            ))}
          </nav>

          <button onClick={() => base44.auth.redirectToLogin()} style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer',
            background: '#f5a623', color: '#050505', border: 'none', flexShrink: 0,
          }}>
            Sign In →
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: 'clamp(60px, 10vw, 110px) 24px clamp(50px, 8vw, 90px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(245,166,35,0.13), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio" style={{ height: 72, width: 72, borderRadius: 20, objectFit: 'contain', marginBottom: 28, boxShadow: '0 0 40px rgba(245,166,35,0.2)' }} />
          <h1 style={{ fontSize: 'clamp(38px, 8vw, 76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 20 }}>
            Your reading life,<br /><span style={{ color: '#f5a623' }}>supercharged.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#888', marginBottom: 36, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            AI-powered book discovery, a personal library tracker,<br />and a reading companion that learns your taste.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => base44.auth.redirectToLogin()} style={{
              padding: '15px 36px', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: 'pointer',
              background: '#f5a623', color: '#050505', border: 'none', boxShadow: '0 0 40px rgba(245,166,35,0.25)',
            }}>
              Get Started Free →
            </button>
            <button onClick={() => base44.auth.redirectToLogin()} style={{
              padding: '15px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              background: 'transparent', color: '#f0ebe0', border: '1px solid #2a2a2a',
            }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── QUICK FEATURE CARDS ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: '📖', title: 'Discover Books', desc: 'Browse trending titles and search millions of books' },
            { icon: '✨', title: 'AI Recommendations', desc: 'Get personalized picks powered by AI' },
            { icon: '💬', title: 'Chat About Books', desc: 'Talk to your AI reading companion anytime' },
          ].map(c => (
            <div key={c.title} style={{ padding: '24px', borderRadius: 14, background: '#111', border: '1px solid #1c1c1c' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{c.title}</div>
              <div style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid #1c1c1c', background: '#080808' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 12 }}>
              Everything you need to <span style={{ color: '#f5a623' }}>read better.</span>
            </h2>
            <p style={{ color: '#666', fontSize: 16 }}>Every feature built with one purpose — to make reading more rewarding.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                borderTop: '1px solid #1c1c1c', padding: 'clamp(28px,4vw,44px) 0',
              }}>
                <div style={{ paddingRight: 'clamp(20px,4vw,48px)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#f5a623', marginBottom: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 12 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75 }}>{f.desc}</p>
                </div>
                <div style={{ paddingLeft: 'clamp(20px,4vw,48px)' }}>
                  <div style={{ borderRadius: 16, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: f.color, border: `1px solid ${f.accent}22` }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: `2px solid ${f.accent}`, opacity: 0.15 }} />
                      <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: `2px solid ${f.accent}`, opacity: 0.25 }} />
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`, borderRadius: '16px 16px 0 0' }} />
                    <div style={{ fontSize: 52, position: 'relative', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.15))' }}>{f.emoji}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', paddingTop: 48, borderTop: '1px solid #1c1c1c' }}>
            <button onClick={() => base44.auth.redirectToLogin()} style={{
              padding: '15px 44px', borderRadius: 12, fontSize: 16, fontWeight: 900, cursor: 'pointer',
              background: '#f5a623', color: '#050505', border: 'none',
            }}>
              Start Using All Features Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid #1c1c1c' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 48 }}>
            About <span style={{ color: '#f5a623' }}>Lexio.</span>
          </h2>
          {[
            { title: 'What is Lexio?', body: 'Lexio is a free reading companion app built for people who love books. We wanted to create the tool we wished existed — powerful enough for serious readers, simple enough for anyone.' },
            { title: 'Our Mission', body: 'To make reading trackable, social, and rewarding — for everyone, at no cost. We are committed to keeping all core features free forever. No subscriptions, no paywalls, no tricks.' },
            { title: 'Who is it for?', body: 'Casual readers who want to track their shelf. Power readers who log every session. Students in classrooms with School Mode. Book clubs reading together. Anyone who believes books matter.' },
            { title: 'Free Forever', body: 'Lexio was built on the belief that reading tools should be accessible to everyone. Core features will always be free. If premium features are ever introduced, they will be clearly optional.' },
          ].map(({ title, body }) => (
            <div key={title} style={{ borderTop: '1px solid #1c1c1c', paddingTop: 28, paddingBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#f5a623' }}>{title}</h3>
              <p style={{ fontSize: 15, color: '#888', lineHeight: 1.8 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid #1c1c1c', background: '#080808' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 12 }}>
            Say <span style={{ color: '#f5a623' }}>hello.</span>
          </h2>
          <p style={{ color: '#666', marginBottom: 36, fontSize: 16 }}>Questions, feedback, or bug reports — we read every message.</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 10, marginBottom: 36, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <span style={{ fontSize: 16 }}>✉️</span>
            <a href="mailto:Support@LexioReading.App" style={{ color: '#f5a623', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Support@LexioReading.App</a>
          </div>

          {contactSent ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 16, background: '#111', border: '1px solid #1c1c1c' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
              <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Message received!</h3>
              <p style={{ color: '#666' }}>We'll get back to you at {contactForm.email} soon.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ key: 'name', label: 'NAME', type: 'text', placeholder: 'Jane Smith' }, { key: 'email', label: 'EMAIL', type: 'email', placeholder: 'jane@example.com' }].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 7, letterSpacing: '1px' }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={contactForm[key]}
                    onChange={e => setContactForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '13px 15px', borderRadius: 10, fontSize: 15, outline: 'none', background: '#111', border: '1px solid #2a2a2a', color: '#f0ebe0', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 7, letterSpacing: '1px' }}>MESSAGE</label>
                <textarea rows={4} placeholder="What's on your mind?" value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', padding: '13px 15px', borderRadius: 10, fontSize: 15, outline: 'none', background: '#111', border: '1px solid #2a2a2a', color: '#f0ebe0', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={sending || !contactForm.name || !contactForm.email || !contactForm.message}
                style={{ padding: '15px', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: 'pointer', background: '#f5a623', color: '#050505', border: 'none', opacity: (sending || !contactForm.name || !contactForm.email || !contactForm.message) ? 0.4 : 1 }}>
                {sending ? 'Sending...' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1c1c1c', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio" style={{ height: 22, width: 22, borderRadius: 5, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, color: '#f5a623' }}>Lexio</span>
        </div>
        <p style={{ fontSize: 12, color: '#444' }}>Free forever · Support@LexioReading.App</p>
      </footer>
    </div>
  );
}