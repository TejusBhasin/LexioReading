import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ChevronDown, Send, Check, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FAQS = [
  {
    q: 'How do I create an account?',
    a: 'Download Lexio from the App Store, tap "Create one" on the login screen, and follow the sign-up flow. You can register with email or sign in with Google, Apple, or Microsoft.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot password?" and enter your email. You\'ll receive a reset link to create a new password.',
  },
  {
    q: 'Is Lexio free?',
    a: 'Yes! Lexio is free forever for all core features — adding books, tracking reading, writing reviews, joining clubs, and more.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → Settings → Delete Account in the app. This permanently removes your account and all associated data.',
  },
  {
    q: 'How do I report inappropriate content?',
    a: 'Use the "Report" button on any post, review, or profile. Our moderation team reviews all reports promptly.',
  },
  {
    q: 'Can I make my profile private?',
    a: 'Yes. Go to Profile → Privacy Settings to control who can see your library, reviews, stats, and profile.',
  },
];

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendSupportEmail', form);
      if (res.data?.error) throw new Error(res.data.error);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please email us directly at Support@LexioReading.App');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://media.base44.com/images/public/user_6a12376d0f4ca5762da03b88/1678f5c8f_Lexio.png"
            alt="Lexio"
            className="h-7 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Lexio Support
          </span>
        </div>

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <a
            href="mailto:Support@LexioReading.App"
            className="lx-card p-5 flex items-center gap-4 no-underline"
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,214,35,0.12)' }}
            >
              <Mail size={20} style={{ color: 'var(--lx-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Email Us</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Support@LexioReading.App</p>
            </div>
          </a>

          <Link to="/terms-privacy" className="lx-card p-5 flex items-center gap-4 no-underline">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,214,35,0.12)' }}
            >
              <Shield size={20} style={{ color: 'var(--lx-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Terms & Privacy</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>View our policies</p>
            </div>
          </Link>
        </div>

        {/* Contact Form */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Send Us a Message
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Have a question or need help? Fill out the form below and we'll get back to you.
          </p>

          {sent ? (
            <div
              className="lx-card p-6 flex items-center gap-3"
              style={{ borderColor: 'rgba(16,185,129,0.4)' }}
            >
              <Check size={20} style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Message sent!
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  We'll respond to your email within 24–48 hours.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="lx-card p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    className="lx-input text-sm"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    className="lx-input text-sm"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  Subject *
                </label>
                <input
                  className="lx-input text-sm"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  Message *
                </label>
                <textarea
                  className="lx-input text-sm resize-none"
                  rows={5}
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending || !form.email || !form.subject || !form.message}
                className="lx-btn-primary text-sm w-full sm:w-auto"
              >
                {sending ? 'Sending...' : (<><Send size={14} /> Send Message</>)}
              </button>
            </form>
          )}
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="lx-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: 'var(--text-muted)',
                      transition: 'transform 0.2s',
                      transform: openFaq === i ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div
                    className="px-4 pb-4 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div
          className="text-center text-xs pt-8 border-t"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <p>Lexio — Your Reading Companion</p>
          <p className="mt-1">
            <Link to="/terms-privacy" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
            {' · '}
            <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
            {' · '}
            <a href="mailto:Support@LexioReading.App" style={{ color: 'var(--text-secondary)' }}>Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}