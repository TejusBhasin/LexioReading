import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, MessageSquare, User, Star, Users, Clock, Lock, Sparkles, Menu, X, Newspaper } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { applyTheme } from '@/lib/theme';
import SetupTour from '@/components/onboarding/SetupTour.jsx';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/reading-log', icon: Clock, label: 'Log' },
  { path: '/reviews', icon: Star, label: 'Reviews' },
  { path: '/clubs', icon: Users, label: 'Clubs' },
  { path: '/forums', icon: Newspaper, label: 'Forums' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const EXTRA_NAV = [
  { path: '/vault', icon: Lock, label: 'Vault' },
];

const BOTTOM_NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/reading-log', icon: Clock, label: 'Log' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function AppShell({ children, user }) {
  const location = useLocation();
  const [prefs, setPrefs] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileMenuOpen(false);
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user?.email) {
      loadPrefs();
      loadUserProfile();
    } else {
      applyTheme({ theme_mode: 'bold', color_scheme: 'dark' });
    }
  }, [user]);

  async function loadPrefs() {
    try {
      const results = await base44.entities.UserPreferences.filter({ user_email: user.email });
      if (results.length > 0) {
        setPrefs(results[0]);
        applyTheme(results[0]);
      } else {
        applyTheme({ theme_mode: 'bold', color_scheme: 'dark' });
      }
    } catch (e) {
      applyTheme({ theme_mode: 'bold', color_scheme: 'dark' });
    }
  }

  async function loadUserProfile() {
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) {
        setUserProfile(p[0]);
        if (!p[0].onboarding_complete) setShowTour(true);
      } else {
        setShowTour(true);
      }
    } catch (e) {}
  }

  return (
    <div className="min-h-screen lx-bg flex flex-col">
      {showTour && user && (
        <SetupTour
          user={user}
          userProfile={userProfile}
          onComplete={() => { setShowTour(false); loadUserProfile(); }}
        />
      )}
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-display font-bold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>Lexio</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, icon: NavIcon, label }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all"
                  style={{
                    color: active ? 'var(--lx-accent)' : 'var(--text-secondary)',
                    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <NavIcon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {EXTRA_NAV.map(({ path, icon: EIcon, label }) => (
                  <Link key={path} to={path} title={label}
                    className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all"
                    style={{ color: 'var(--text-muted)' }}>
                    <EIcon size={14} />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="lx-btn-ghost text-sm py-1.5 px-3">Sign In</Link>
                <Link to="/signup" className="lx-btn-primary text-sm py-1.5 px-3">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden fixed left-0 right-0 z-40 border-b shadow-lg"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          <nav className="px-4 py-3 space-y-1">
            {[...NAV_ITEMS, ...EXTRA_NAV].map(({ path, icon: MIcon, label }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all"
                  style={{ color: active ? 'var(--lx-accent)' : 'var(--text-primary)', background: active ? 'var(--bg-elevated)' : 'transparent' }}>
                  <MIcon size={17} />
                  {label}
                </Link>
              );
            })}
            {!user && (
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                <Link to="/login" className="lx-btn-ghost text-sm flex-1 justify-center">Sign In</Link>
                <Link to="/signup" className="lx-btn-primary text-sm flex-1 justify-center">Get Started</Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--lx-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
        {BOTTOM_NAV_ITEMS.map(({ path, icon: BotIcon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
              style={{ color: active ? 'var(--lx-accent)' : 'var(--text-muted)' }}>
              <BotIcon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}