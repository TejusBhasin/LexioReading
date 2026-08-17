import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, BookOpen, Compass, Sparkles } from 'lucide-react';
import SetupTour from '@/components/onboarding/SetupTour';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function WelcomePage() {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    async function check() {
      if (!user?.email) return;
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        const p = profiles.find(x => x.username) || profiles[0];
        setUserProfile(p);
        if (!p || !p.onboarding_complete) setShowTour(true);
      } catch (e) {}
    }
    check();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-primary)' }}>
      {showTour && user && (
        <SetupTour user={user} userProfile={userProfile} onComplete={() => setShowTour(false)} />
      )}
      <div className="w-full max-w-md text-center">
        {/* Success badge */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--lx-accent)' }}>
          <Check size={32} style={{ color: 'var(--bg-primary)' }} />
        </div>

        <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Welcome to Lexio 📚
        </h1>
        <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--lx-accent)' }}>
          Your account is ready. Free forever.
        </p>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Let's find your next great read. Set up your reading profile and start discovering books tailored to you.
        </p>

        {/* Quick actions */}
        <div className="space-y-3 mb-8">
          <Link to="/" className="lx-btn-primary w-full justify-center text-sm">
            <Sparkles size={14} /> Start Reading
          </Link>
          <Link to="/discover" className="lx-btn-ghost w-full justify-center text-sm">
            <Compass size={14} /> Discover Books
          </Link>
          <Link to="/library" className="lx-btn-ghost w-full justify-center text-sm">
            <BookOpen size={14} /> Go to My Library
          </Link>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Tip: complete your profile setup to get personalized recommendations.
        </p>
      </div>
    </div>
  );
}