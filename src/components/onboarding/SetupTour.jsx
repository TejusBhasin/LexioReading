import React, { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

function TandC() {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-left rounded-lg mb-5 overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}>
        <span>Terms &amp; Conditions / Privacy Policy</span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs space-y-2 max-h-48 overflow-y-auto" style={{ color: 'var(--text-muted)' }}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Terms of Service</strong></p>
          <p>Lexio is a free reading companion app. By using Lexio you agree to use it for personal, non-commercial reading purposes only.</p>
          <p>You are responsible for the content you post (reviews, discussions). Hateful, illegal, or abusive content is prohibited and may result in account termination.</p>
          <p>Lexio reserves the right to modify or discontinue services at any time. We are not responsible for third-party links (e.g. Amazon, Google Books).</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Liability &amp; No-Sue:</strong> Lexio is NOT responsible for data breaches, hacks, security incidents, or any physical, mental, emotional, financial, or online damage. Lexio and its team are immune from all legal action. You waive all rights to sue.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Privacy Policy</strong></p>
          <p>We collect only the data necessary to provide the service: your email address, reading preferences, and content you create (logs, reviews, library entries).</p>
          <p>We do not sell your data to third parties. Your data is stored securely and is never shared without your consent, except as required by law.</p>
          <p>You can delete your account and all associated data at any time by contacting support.</p>
          <p className="pt-1" style={{ color: 'var(--text-secondary)' }}>Lexio is free forever for core features. Premium features, if introduced, will always be optional.</p>
          <p style={{ color: 'var(--text-muted)' }}>You are welcome to use other reading platforms and services. You agree not to create, develop, or build any new reading-related application or platform that competes with Lexio.</p>
        </div>
      )}
    </div>
  );
}
import { base44 } from '@/api/base44Client';
import { GENRE_OPTIONS, MOOD_OPTIONS } from '@/lib/theme';
import { CURRENT_TERMS_VERSION } from '@/components/onboarding/TermsReAcceptModal';
import DownloadAppStep from '@/components/onboarding/DownloadAppStep';
import { getDownloadStepStatus, SKIP_EVENT_MAP } from '@/lib/platformDetect';

const STEPS = ['welcome', 'genres', 'content', 'features', 'clubs', 'streak', 'schools', 'download_app', 'done'];

const CONTENT_THEMES = [
  'Romance', 'Violence', 'Death/Loss', 'Addiction', 'War', 'Abuse', 'Mental illness'
];

export default function SetupTour({ user, userProfile, onComplete, forceComplete = false, autoJoinedSchool = null }) {
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [tcAgreed, setTcAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }
  function toggleTheme(t) {
    setBlacklisted(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function loadSchoolClasses() {
    try {
      let schoolId = autoJoinedSchool?.id;
      if (!schoolId) {
        const memberships = await base44.entities.SchoolMember.filter({ user_email: user.email, kicked: false });
        const activeMember = memberships.find(m => !m.dual_mode_enabled || m.currently_school_mode);
        if (activeMember) schoolId = activeMember.school_id;
      }
      if (schoolId) {
        const classes = await base44.entities.SchoolClass.filter({ school_id: schoolId });
        setSchoolClasses(classes);
      }
    } catch (e) {}
  }

  async function enrollInClass() {
    if (!selectedClassId) return;
    setEnrolling(true);
    try {
      await base44.functions.invoke('manageClassEnrollment', { action: 'enroll', class_id: selectedClassId });
    } catch (e) {}
    setEnrolling(false);
  }

  function handleSchoolsNext() {
    const status = getDownloadStepStatus();
    if (status.shouldShow) {
      setStep(STEPS.indexOf('download_app'));
    } else {
      if (status.reason && SKIP_EVENT_MAP[status.reason]) {
        try { base44.analytics.track({ eventName: SKIP_EVENT_MAP[status.reason] }); } catch (e) {}
      }
      setStep(STEPS.indexOf('done'));
    }
  }

  async function skip() {
    setSaving(true);
    try {
      localStorage.setItem('lexio_terms_version', CURRENT_TERMS_VERSION);
      const profileData = {
        user_email: user.email,
        tc_agreed: tcAgreed,
        tc_agreed_date: new Date().toISOString(),
        tc_version: CURRENT_TERMS_VERSION,
        onboarding_complete: true,
        onboarding_skipped: true,
      };
      const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (existing[0]) {
        await base44.entities.UserProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }
      onComplete();
    } catch (e) {}
    setSaving(false);
  }

  async function finish() {
    setSaving(true);
    try {
      localStorage.setItem('lexio_terms_version', CURRENT_TERMS_VERSION);
      const profileData = {
        user_email: user.email,
        tc_agreed: tcAgreed,
        tc_agreed_date: new Date().toISOString(),
        tc_version: CURRENT_TERMS_VERSION,
        blacklisted_themes: blacklisted,
        onboarding_complete: true,
        onboarding_skipped: false,
      };
      const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (existing[0]) {
        await base44.entities.UserProfile.update(existing[0].id, profileData);
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

  useEffect(() => {
    if (STEPS[step] === 'schools' && user?.email) {
      loadSchoolClasses();
    }
  }, [step, user]);

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--lx-accent)' : 'var(--lx-border)' }} />
          ))}
        </div>

        {currentStep === 'welcome' && (
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome to Lexio 📚
            </h2>
            <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--lx-accent)' }}>Free forever. No credit card needed.</p>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Let's set up your reading profile in a few quick steps.
            </p>
            <TandC />
            <label className="flex items-center gap-3 cursor-pointer mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <button onClick={() => setTcAgreed(!tcAgreed)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: tcAgreed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${tcAgreed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                {tcAgreed && <Check size={12} style={{ color: 'var(--bg-primary)' }} />}
              </button>
              I agree to the Terms &amp; Conditions and Privacy Policy
            </label>
            <button onClick={() => setStep(1)} disabled={!tcAgreed} className="lx-btn-primary w-full justify-center">
              Get Started &rarr;
            </button>
            {!forceComplete && (
              <div className="mt-3">
                <button onClick={skip} disabled={!tcAgreed || saving}
                  className="w-full text-xs py-2 rounded transition-all"
                  style={{ color: 'var(--text-muted)', background: 'transparent' }}>
                  Skip for now — I'll set up later
                </button>
                {tcAgreed && (
                  <p className="text-xs mt-1.5 text-center px-2" style={{ color: 'var(--text-muted)' }}>
                    ⚠️ Skipping means less personalized recommendations and no content filtering. You can always complete it from your Profile.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 'genres' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              What do you love reading?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Pick at least 2 genres.</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
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
            <div className="flex flex-wrap gap-1.5 mb-5">
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

        {currentStep === 'features' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              🗺️ Explore Lexio
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Here's everything you can do:</p>
            <div className="space-y-1 mb-5 max-h-60 overflow-y-auto">
              {[
                { emoji: '📚', title: 'Library', desc: 'Track every book you read, are reading, or want to read. Add ratings and notes.' },
                { emoji: '✍️', title: 'Reading Log', desc: 'Log reading sessions with time, mood, and reflections. Build streaks!' },
                { emoji: '🔍', title: 'Discover', desc: 'Search millions of books, see trending titles, and get AI-powered picks.' },
                { emoji: '💬', title: 'AI Chat', desc: 'Your personal AI book companion. Ask for recommendations or discuss anything.' },
                { emoji: '⭐', title: 'Reviews', desc: 'Write reviews for books and read what other readers think.' },
                { emoji: '🗣️', title: 'Forums', desc: 'Post discussions, ask questions, and connect with the reading community.' },
                { emoji: '🔒', title: 'Vault', desc: 'Securely store your library cards and membership info with PIN protection.' },
                { emoji: '🎁', title: 'Wrapped', desc: 'See your year in books — stats, top genres, and reading highlights.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.25" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(STEPS.indexOf('content'))} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(STEPS.indexOf('clubs'))} className="lx-btn-primary flex-1 justify-center">Next</button>
            </div>
          </div>
        )}

        {currentStep === 'clubs' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              👥 Reading Clubs
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Join or create clubs to read together with others.</p>
            <div className="space-y-1.5 mb-5">
              {[
                { emoji: '💬', title: 'Discussion Club', desc: 'A casual space to talk about books, share thoughts, and explore together.' },
                { emoji: '👥', title: 'Administrative Club', desc: 'Admin-led club with structured tracking — pages read, time spent, and mood logs.' },
                { emoji: '📚', title: 'Collaborative Club', desc: 'Read the same book together with chapter-based discussion chains and milestones.' },
                { emoji: '📊', title: 'Logging Club', desc: 'The admin sees a comprehensive dashboard of all members\' reading logs — sessions, times, books, genres, and more. Great for teachers or managers.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(STEPS.indexOf('features'))} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(STEPS.indexOf('streak'))} className="lx-btn-primary flex-1 justify-center">Next</button>
            </div>
          </div>
        )}

        {currentStep === 'streak' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              🔥 Streak &amp; Points System
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Stay motivated with Lexio's Duolingo-style streak system!</p>
            <div className="space-y-2 mb-5">
              {[
                { emoji: '🔥', title: 'Daily Streak', desc: 'Log a reading session every day to build your streak.' },
                { emoji: '🛡️', title: 'Streak Freeze', desc: 'Auto-activates to protect your streak if you miss a day. Buy with 15 points.' },
                { emoji: '❄️', title: 'Ultra Freeze', desc: 'Manually activate a 7-day streak shield. Costs 30 points.' },
                { emoji: '⚡', title: 'Earn Points', desc: 'Log (+3) · Review (+5) · Chat (+1) · Finish a book (+10) · Max 19/day' },
                { emoji: '🏆', title: 'Leaderboard', desc: 'Opt-in to compete with readers worldwide.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-2 p-2 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.25" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(STEPS.indexOf('clubs'))} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={() => setStep(STEPS.indexOf('schools'))} className="lx-btn-primary flex-1 justify-center">Next</button>
            </div>
          </div>
        )}


        {currentStep === 'schools' && (
          <div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              🎓 Schools
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Lexio supports school environments for teachers and classrooms.</p>
            {autoJoinedSchool && (
              <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                <p className="text-xs" style={{ color: '#10b981' }}>
                  <strong>You've been automatically joined to {autoJoinedSchool.name}!</strong> Your school admin can manage your reading experience. You can access school features from your profile.
                </p>
              </div>
            )}
            {schoolClasses.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Select Your Class</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Choose your class to join. You can change it later from your profile.</p>
                <div className="space-y-1.5">
                  {schoolClasses.map(cls => (
                    <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all"
                      style={{
                        background: selectedClassId === cls.id ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                        color: selectedClassId === cls.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${selectedClassId === cls.id ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                      }}>
                      <span>{cls.class_name}</span>
                      {cls.subject && <span className="text-xs opacity-70">{cls.subject}</span>}
                    </button>
                  ))}
                </div>
                {selectedClassId && (
                  <button onClick={enrollInClass} disabled={enrolling}
                    className="lx-btn-primary w-full justify-center text-sm mt-3">
                    {enrolling ? 'Joining...' : 'Join This Class'}
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1 mb-5 max-h-60 overflow-y-auto">
              {[
                { emoji: '🏫', title: 'Join a School', desc: 'Use a join code from your teacher. Note: school membership is permanent — you cannot leave once joined.' },
                { emoji: '➕', title: 'Create a School', desc: 'Teachers can create a school and invite students using a join code.' },
                { emoji: '🎨', title: 'School Themes', desc: 'Schools can apply a mandatory color theme to all members\' Lexio experience.' },
                { emoji: '🔐', title: 'Feature Control', desc: 'School admins can restrict specific features (forums, vault, chat, etc.) for members.' },
                { emoji: '📊', title: 'Admin Dashboard', desc: 'School admins see detailed reading stats — sessions, books, time spent — for every member.' },
                { emoji: '↩️', title: 'Removing Members', desc: 'Admins can remove students, instantly returning them to normal Lexio mode. All data (logs, library) stays intact.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(STEPS.indexOf('streak'))} className="lx-btn-ghost flex-1 justify-center">Back</button>
              <button onClick={handleSchoolsNext} className="lx-btn-primary flex-1 justify-center">Almost done!</button>
            </div>
          </div>
        )}

        {currentStep === 'download_app' && (
          <DownloadAppStep
            onContinue={() => setStep(STEPS.indexOf('done'))}
            onBack={() => setStep(STEPS.indexOf('schools'))}
          />
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
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Explore every feature — your reading life starts now.</p>
            <button onClick={finish} disabled={saving} className="lx-btn-primary w-full justify-center">
              {saving ? 'Saving...' : 'Start Reading'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}