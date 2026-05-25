import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { GENRE_OPTIONS, MOOD_OPTIONS } from '@/lib/theme';

const STEPS = ['welcome', 'genres', 'content', 'streak', 'done'];

const CONTENT_THEMES = [
  'Romance', 'Violence', 'Death/Loss', 'Addiction', 'War', 'Abuse', 'Mental illness'
];

export default function SetupTour({ user, userProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [tcAgreed, setTcAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }
  function toggleTheme(t) {
    setBlacklisted(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function finish() {
    setSaving(true);
    try {
      const profileData = {
        user_email: user.email,
        tc_agreed: tcAgreed,
        tc_agreed_date: new Date().toISOString(),
        blacklisted_themes: blacklisted,
        onboarding_complete: true,
      };
      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }
      // Save genre prefs
      if (genres.length > 0) {
        const existing = await base44.entities.UserPreferences.filter({ user_email: user.email });
        if (existing[0]) {
          await base44.entities.UserPreferences.update(existing[0].id, { favorite_genres: genres });
        } else {
          await base44.entities.UserPreferences.create({ user_email: user.email, favorite_genres: genres });
        }
      }
      onComplete();
    } catch (e) {}
    setSaving(false);
  }

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--lx-accent)' : 'var(--lx-border)' }} />
          ))}
        </div>

        {currentStep === 'welcome' && (
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Welcome to Lexio 📚
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Let's set up your reading profile in 2 quick steps.
            </p>
            <div className="text-left p-4 rounded-lg mb-6 text-sm space-y-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                By continuing, you agree to our{' '}
                <span style={{ color: 'var(--lx-accent)' }}>Terms & Conditions</span> and{' '}
                <span style={{ color: 'var(--lx-accent)' }}>Privacy Policy</span>.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <button onClick={() => setTcAgreed(!tcAgreed)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: tcAgreed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${tcAgreed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                {tcAgreed && <Check size={12} style={{ color: 'var(--bg-primary)' }} />}
              </button>
              I agree to the Terms & Conditions
            </label>
            <button onClick={() => setStep(1)} disabled={!tcAgreed} className="lx-btn-primary w-full justify-center">
              Get Started
            </button>
          </div>
        )}

        {currentStep === 'genres' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              What do you love reading?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Pick at least 2 genres.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GENRE_OPTIONS.map(g => {
                const sel = genres.includes(g);
                return (
                  <button key={g} onClick={() => toggleGenre(g)}
                    className="text-sm px-3 py-1.5 rounded transition-all"
                    style={{
                      background: sel ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: sel ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${sel ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {sel && <Check size={11} className="inline mr-1" />}{g}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(2)} disabled={genres.length < 2} className="lx-btn-primary flex-1 justify-center">
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 'content' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Any themes to avoid?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Optional — we'll filter these from recommendations.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {CONTENT_THEMES.map(t => {
                const sel = blacklisted.includes(t);
                return (
                  <button key={t} onClick={() => toggleTheme(t)}
                    className="text-sm px-3 py-1.5 rounded transition-all"
                    style={{
                      background: sel ? 'rgba(220,38,38,0.2)' : 'var(--bg-elevated)',
                      color: sel ? '#f87171' : 'var(--text-secondary)',
                      border: `1px solid ${sel ? '#f87171' : 'var(--lx-border)'}`,
                    }}>{t}</button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(3)} className="lx-btn-primary flex-1 justify-center">Continue</button>
            </div>
          </div>
        )}

        {currentStep === 'streak' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              🔥 Streak &amp; Points System
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Stay motivated with Lexio's Duolingo-style streak system!</p>
            <div className="space-y-3 mb-6">
              {[
                { emoji: '🔥', title: 'Daily Streak', desc: 'Log a reading session every day to build your streak.' },
                { emoji: '🛡️', title: 'Streak Freeze', desc: 'Auto-activates to protect your streak if you miss a day. Buy with 15 points.' },
                { emoji: '❄️', title: 'Ultra Freeze', desc: 'Manually activate a 7-day streak shield. Costs 30 points.' },
                { emoji: '⚡', title: 'Earn Points', desc: 'Log (+3) · Review (+5) · Chat (+1) · Finish a book (+10) · Max 19/day' },
                { emoji: '🏆', title: 'Leaderboard', desc: 'Opt-in to compete with readers worldwide.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-2xl flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(4)} className="lx-btn-primary flex-1 justify-center">Got it!</button>
            </div>
          </div>
        )}

        {currentStep === 'done' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--lx-accent)' }}>
              <Check size={28} style={{ color: 'var(--bg-primary)' }} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              You're all set!
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Your reading profile is ready. Start discovering books tailored to you.
            </p>
            <button onClick={finish} disabled={saving} className="lx-btn-primary w-full justify-center">
              {saving ? 'Saving...' : 'Start Reading'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}