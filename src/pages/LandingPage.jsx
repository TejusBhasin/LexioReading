import React, { useState } from 'react';
import { BookOpen, Zap, Users, Star, Target, Trophy, MessageSquare, Shield, ChevronRight, Mail, Newspaper, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TABS = ['Home', 'Features', 'About', 'Contact'];

const FEATURES = [
  { icon: BookOpen, title: 'Smart Library', desc: 'Track every book you\'ve read, are reading, or want to read. Add ratings, notes, and tags.' },
  { icon: Zap, title: 'Reading Streaks', desc: 'Build daily reading habits with a Duolingo-style streak and points system. Stay motivated.' },
  { icon: Users, title: 'Reading Clubs', desc: 'Join or create clubs — discussion, collaborative, administrative, or logging-focused.' },
  { icon: MessageSquare, title: 'AI Book Companion', desc: 'Chat with an AI that knows your reading history. Get personalized recommendations instantly.' },
  { icon: Star, title: 'Reviews & Forums', desc: 'Write reviews, post in community forums, and connect with readers who share your taste.' },
  { icon: Target, title: 'Reading Goals', desc: 'Set annual book and page targets, track your progress, and get AI-powered goal suggestions.' },
  { icon: Trophy, title: 'Challenges & Bingo', desc: 'Complete AI-generated reading bingo challenges and earn points on the leaderboard.' },
  { icon: Newspaper, title: 'Reading Log', desc: 'Log sessions with time, mood, and reflections. See your strength analytics over time.' },
  { icon: Lock, title: 'Vault', desc: 'Securely store library cards and memberships with PIN protection.' },
  { icon: Shield, title: 'School Mode', desc: 'Teachers can create schools, assign themes, and track student reading progress.' },
];

export default function LandingPage() {
  const [tab, setTab] = useState('Home');
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
        subject: `Landing Page Contact: ${contactForm.name}`,
        body: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`,
      });
      setContactSent(true);
    } catch (e) {}
    setSending(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#f5f0e8' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(10,10,10,0.95)', borderColor: '#1a1a1a', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio"
              className="h-9 w-9 rounded-xl object-contain"
            />
            <span className="font-bold text-xl tracking-tight" style={{ color: '#f5a623' }}>Lexio</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? '#f5a623' : 'transparent',
                  color: tab === t ? '#0a0a0a' : '#a8a29e',
                }}>
                {t}
              </button>
            ))}
          </nav>

          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#f5a623', color: '#0a0a0a' }}>
            Sign In
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: tab === t ? '#f5a623' : '#161616',
                color: tab === t ? '#0a0a0a' : '#a8a29e',
                border: '1px solid #2a2a2a',
              }}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1">

        {/* HOME TAB */}
        {tab === 'Home' && (
          <div>
            {/* Hero */}
            <section className="relative overflow-hidden py-24 px-6 text-center" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.15), transparent)' }} />
              <div className="max-w-4xl mx-auto relative">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
                  style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623' }}>
                  📚 The Reading App Built Different
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none tracking-tight">
                  Your entire{' '}
                  <span style={{ color: '#f5a623' }}>reading life,</span>
                  <br />in one place.
                </h1>
                <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#a8a29e' }}>
                  Track books, build streaks, join clubs, chat with AI, write reviews, and compete on leaderboards. 
                  Free forever.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="px-8 py-4 rounded-xl text-base font-black transition-all hover:scale-105 flex items-center gap-2 justify-center"
                    style={{ background: '#f5a623', color: '#0a0a0a', boxShadow: '0 0 40px rgba(245,166,35,0.3)' }}>
                    Get Started Free <ChevronRight size={18} />
                  </button>
                  <button onClick={() => setTab('Features')}
                    className="px-8 py-4 rounded-xl text-base font-bold transition-all hover:border-[#f5a623] flex items-center gap-2 justify-center"
                    style={{ border: '2px solid #2a2a2a', color: '#f5f0e8' }}>
                    See All Features
                  </button>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="py-16 px-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { num: '10+', label: 'Core Features' },
                  { num: '4', label: 'Club Types' },
                  { num: '∞', label: 'Books Trackable' },
                  { num: 'Free', label: 'Forever' },
                ].map(s => (
                  <div key={s.label} className="text-center p-6 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                    <div className="text-4xl font-black mb-1" style={{ color: '#f5a623' }}>{s.num}</div>
                    <div className="text-sm font-medium" style={{ color: '#a8a29e' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Feature highlights */}
            <section className="py-20 px-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-center">Everything a reader needs.</h2>
                <p className="text-center mb-12" style={{ color: '#a8a29e' }}>No fluff. Just powerful features built for serious readers.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {FEATURES.slice(0, 6).map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-6 rounded-2xl transition-all hover:border-[#f5a623]"
                      style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(245,166,35,0.15)' }}>
                        <Icon size={20} style={{ color: '#f5a623' }} />
                      </div>
                      <h3 className="font-black text-base mb-2">{title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#a8a29e' }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to start reading smarter?</h2>
                <p className="mb-8 text-lg" style={{ color: '#a8a29e' }}>Join Lexio today. Free forever. No credit card needed.</p>
                <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="px-10 py-4 rounded-xl text-base font-black transition-all hover:scale-105"
                  style={{ background: '#f5a623', color: '#0a0a0a', boxShadow: '0 0 60px rgba(245,166,35,0.25)' }}>
                  Create Your Account →
                </button>
              </div>
            </section>
          </div>
        )}

        {/* FEATURES TAB */}
        {tab === 'Features' && (
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-center mb-14">
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Every feature you <span style={{ color: '#f5a623' }}>need.</span>
              </h1>
              <p style={{ color: '#a8a29e' }}>Built for readers who take their reading seriously.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-5 p-6 rounded-2xl transition-all hover:border-[#f5a623]"
                  style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,166,35,0.15)' }}>
                    <Icon size={22} style={{ color: '#f5a623' }} />
                  </div>
                  <div>
                    <h3 className="font-black text-base mb-1">{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#a8a29e' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="px-10 py-4 rounded-xl font-black text-base transition-all hover:scale-105"
                style={{ background: '#f5a623', color: '#0a0a0a' }}>
                Get All Features Free →
              </button>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {tab === 'About' && (
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              About <span style={{ color: '#f5a623' }}>Lexio.</span>
            </h1>
            <div className="space-y-6 text-base leading-relaxed" style={{ color: '#a8a29e' }}>
              <p className="text-lg" style={{ color: '#f5f0e8' }}>
                Lexio is a free, fully-featured reading companion built for people who love books.
              </p>
              <p>
                We believe reading is one of the most powerful habits a person can build — and we wanted to create a tool that makes it easier, more enjoyable, and more social. Lexio is the app we wished existed.
              </p>
              <div className="p-6 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="font-black text-lg mb-3" style={{ color: '#f5a623' }}>Our Mission</h3>
                <p>To make reading accessible, trackable, and social — for everyone, at no cost. We're committed to keeping core features free forever.</p>
              </div>
              <div className="p-6 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="font-black text-lg mb-3" style={{ color: '#f5a623' }}>What Makes Lexio Different</h3>
                <ul className="space-y-2">
                  {[
                    'Duolingo-style streaks and points keep you motivated daily',
                    'Four distinct reading club types for every kind of reader group',
                    'School Mode with full admin controls for teachers and classrooms',
                    'AI-powered chat, recommendations, and goal suggestions',
                    'Reading Strength analytics to understand your reading patterns',
                    'Bingo challenges and leaderboards for a gamified experience',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span style={{ color: '#f5a623' }}>→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="font-black text-lg mb-3" style={{ color: '#f5a623' }}>Privacy First</h3>
                <p>We collect only what's needed to power the app. We never sell your data. You own your reading history and can delete it anytime.</p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="px-10 py-4 rounded-xl font-black text-base transition-all hover:scale-105"
                style={{ background: '#f5a623', color: '#0a0a0a' }}>
                Join Lexio Free →
              </button>
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {tab === 'Contact' && (
          <div className="max-w-2xl mx-auto px-6 py-16">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Get in <span style={{ color: '#f5a623' }}>touch.</span>
            </h1>
            <p className="mb-10 text-base" style={{ color: '#a8a29e' }}>
              Questions, feedback, or just want to say hi? We'd love to hear from you.
            </p>

            <div className="p-4 rounded-xl mb-8 flex items-center gap-3"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
              <Mail size={16} style={{ color: '#f5a623' }} />
              <span className="text-sm font-bold" style={{ color: '#f5a623' }}>Support@LexioReading.App</span>
            </div>

            {contactSent ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-black text-xl mb-2">Message sent!</h3>
                <p style={{ color: '#a8a29e' }}>We'll get back to you at {contactForm.email}.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#a8a29e' }}>Your Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f5f0e8' }}
                    placeholder="Jane Smith"
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = '#f5a623'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#a8a29e' }}>Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f5f0e8' }}
                    placeholder="jane@example.com"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = '#f5a623'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#a8a29e' }}>Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f5f0e8' }}
                    placeholder="Tell us what's on your mind..."
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = '#f5a623'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !contactForm.name || !contactForm.email || !contactForm.message}
                  className="w-full py-4 rounded-xl font-black text-base transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#f5a623', color: '#0a0a0a' }}>
                  {sending ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center" style={{ borderColor: '#1a1a1a' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png" alt="Lexio" className="h-6 w-6 rounded-md object-contain" />
          <span className="font-bold" style={{ color: '#f5a623' }}>Lexio</span>
        </div>
        <p className="text-xs" style={{ color: '#57534e' }}>Free forever · No credit card needed · Support@LexioReading.App</p>
      </footer>
    </div>
  );
}