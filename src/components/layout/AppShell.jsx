import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, MessageSquare, User, Star, Users, Clock, Lock, Menu, X, Newspaper, Target, Quote, Trophy, ChevronDown, Zap } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell.jsx';
import { base44 } from '@/api/base44Client';
import { applyTheme } from '@/lib/theme';
import SetupTour from '@/components/onboarding/SetupTour.jsx';
import TermsReAcceptModal, { CURRENT_TERMS_VERSION } from '@/components/onboarding/TermsReAcceptModal.jsx';
import BanScreen from '@/components/safety/BanScreen.jsx';

const NAV_ITEMS = [
{ path: '/', icon: LayoutDashboard, label: 'Home' },
{ path: '/discover', icon: Compass, label: 'Discover' },
{ path: '/library', icon: BookOpen, label: 'Library' },
{ path: '/reading-log', icon: Clock, label: 'Log' },
{ path: '/reviews', icon: Star, label: 'Reviews' },
{ path: '/clubs', icon: Users, label: 'Clubs' },
{ path: '/forums', icon: Newspaper, label: 'Forums' },
{ path: '/chat', icon: MessageSquare, label: 'Chat' },
{ path: '/profile', icon: User, label: 'Profile' }];


const OTHER_NAV = [
{ path: '/goal', icon: Target, label: 'Reading Goal' },
{ path: '/quotes', icon: Quote, label: 'Quotes' },
{ path: '/challenges', icon: Trophy, label: 'Challenges' },
{ path: '/strength', icon: Zap, label: 'Reading Strength' }];


const EXTRA_NAV = [
{ path: '/vault', icon: Lock, label: 'Vault' }];


const BOTTOM_NAV_ITEMS = [
{ path: '/', icon: LayoutDashboard, label: 'Home' },
{ path: '/discover', icon: Compass, label: 'Discover' },
{ path: '/library', icon: BookOpen, label: 'Library' },
{ path: '/reading-log', icon: Clock, label: 'Log' },
{ path: '/profile', icon: User, label: 'Profile' }];


export default function AppShell({ children, user }) {
  const location = useLocation();
  const [prefs, setPrefs] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [forceTour, setForceTour] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [needsTermsAccept, setNeedsTermsAccept] = useState(false);
  const menuRef = useRef(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const mainRef = useRef(null);
  const PTR_THRESHOLD = 64;

  const handleTouchStart = useCallback((e) => {
    if (mainRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PTR_THRESHOLD + 20));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PTR_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PTR_THRESHOLD);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  }, [pullDistance]);



  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileMenuOpen(false);
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {setMobileMenuOpen(false);setOtherOpen(false);setMoreOpen(false);}, [location.pathname]);

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
      const [p, safetyRecs, blockedPatterns, schoolMemberRecs] = await Promise.all([
      base44.entities.UserProfile.filter({ user_email: user.email }),
      base44.entities.UserSafeness.filter({ user_email: user.email }),
      base44.entities.BlockedPattern.filter({ is_active: true }),
      base44.entities.SchoolMember.filter({ user_email: user.email })]
      );

      // Apply school theme if member of active school
      const activeSchoolMember = schoolMemberRecs.find((m) => !m.kicked);
      if (activeSchoolMember) {
        const schools = await base44.entities.School.filter({ id: activeSchoolMember.school_id, is_active: true });
        if (schools[0]) {
          const s = schools[0];
          if (s.theme_locked) {
            document.documentElement.style.setProperty('--lx-accent', s.theme_primary || '#f5a623');
            document.documentElement.style.setProperty('--accent-primary', s.theme_primary || '#f5a623');
            document.documentElement.style.setProperty('--accent-secondary', s.theme_accent || '#e8854a');
            document.documentElement.style.setProperty('--bg-secondary', s.theme_secondary || '#111111');
          }
          // If school requires setup tour and user skipped it, force it
          if (s.require_setup_tour && (p.find(x => x.username) || p[0])?.onboarding_skipped) {
            setForceTour(true);
          }
        }
      }

      // Check full ban (with optional expiry)
      const safety = safetyRecs[0];
      const banExpired = safety?.ban_expires && new Date(safety.ban_expires) < new Date();
      if (safety?.is_banned && !banExpired) {
        setIsBanned(true);
        setBanReason(safety.ban_reason || 'Your account has been restricted by a moderator.');
        return;
      }

      // Check blocked email patterns
      const emailBlocked = blockedPatterns.
      filter((bp) => bp.pattern_type === 'email' && bp.is_active).
      some((bp) => user.email?.toLowerCase().includes(bp.pattern.toLowerCase()));
      if (emailBlocked) {
        setIsBanned(true);
        setBanReason('This email address is not permitted on Lexio.');
        return;
      }

      if (p[0]) {
        // If multiple profiles exist, prefer the one with a username (or oldest)
        const profile = p.find(x => x.username) || p[0];
        setUserProfile(profile);
        // Check if terms version needs re-acceptance (use localStorage as fast cache)
        const localVersion = localStorage.getItem('lexio_terms_version');
        const profileVersion = profile.tc_version;
        // If profile has current version, cache it locally and don't prompt
        if (profileVersion === CURRENT_TERMS_VERSION) {
          localStorage.setItem('lexio_terms_version', CURRENT_TERMS_VERSION);
        } else if (localVersion !== CURRENT_TERMS_VERSION && profileVersion !== CURRENT_TERMS_VERSION) {
          setNeedsTermsAccept(true);
        }
        // Check blocked username patterns
        const usernameBlocked = blockedPatterns.
        filter((bp) => bp.pattern_type === 'username' && bp.is_active).
        some((bp) => profile.username?.toLowerCase().includes(bp.pattern.toLowerCase()));
        if (usernameBlocked) {
          setIsBanned(true);
          setBanReason('This username is not permitted on Lexio.');
          return;
        }
        if (!profile.onboarding_complete) setShowTour(true);
      } else {
        setShowTour(true);
      }
    } catch (e) {}
  }

  function handleTermsAccepted() {
    setNeedsTermsAccept(false);
  }

  // Prevent spacebar from scrolling anywhere outside inputs
  useEffect(() => {
    const prevent = (e) => {
      if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', prevent, { capture: true });
    document.addEventListener('keydown', prevent, { capture: true });
    return () => {
      window.removeEventListener('keydown', prevent, { capture: true });
      document.removeEventListener('keydown', prevent, { capture: true });
    };
  }, []);

  return (
    <div className="overflow-hidden lx-bg flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {isBanned && <BanScreen reason={banReason} />}
      {needsTermsAccept && !isBanned && user &&
      <TermsReAcceptModal user={user} onAccepted={handleTermsAccepted} />
      }
      {(showTour || forceTour) && user &&
      <SetupTour
        user={user}
        userProfile={userProfile}
        forceComplete={forceTour}
        onComplete={() => {setShowTour(false);setForceTour(false);loadUserProfile();}} />
      }
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" onClick={() => {setMobileMenuOpen(false);mainRef.current?.scrollTo({ top: 0 });}} className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio"
              className="h-9 w-9 rounded-lg object-contain" />
            
            <span className="font-display font-bold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>Lexio</span>
          </Link>

          {/* Desktop/Landscape Nav — 4 items + menu */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { path: '/', icon: LayoutDashboard, label: 'Home' },
              { path: '/discover', icon: Compass, label: 'Discover' },
              { path: '/chat', icon: MessageSquare, label: 'Chat' },
            ].map(({ path, icon: NavIcon, label }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                  style={{
                    color: active ? 'var(--lx-accent)' : 'var(--text-secondary)',
                    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent'
                  }}>
                  <NavIcon size={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
            {/* All-pages menu */}
            <div className="relative">
              <button
                onClick={() => setOtherOpen((o) => !o)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  color: otherOpen || !['/','discover','/chat'].includes(location.pathname) ? 'var(--lx-accent)' : 'var(--text-secondary)',
                  backgroundColor: otherOpen ? 'var(--bg-elevated)' : 'transparent'
                }}>
                <Menu size={15} />
              </button>
              {otherOpen &&
              <div className="absolute top-full right-0 mt-1 w-52 rounded-lg shadow-lg py-1 z-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                {[...NAV_ITEMS, ...OTHER_NAV, ...EXTRA_NAV].map(({ path, icon: OIcon, label }) =>
                  <Link key={path} to={path}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all hover:opacity-80"
                    style={{ color: location.pathname === path ? 'var(--lx-accent)' : 'var(--text-secondary)' }}>
                    <OIcon size={14} /> {label}
                  </Link>
                )}
                </div>
              }
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {user && <NotificationBell user={user} />}
            {/* Mobile hamburger — shown only if user enabled it in Personalize */}
            {prefs?.show_top_hamburger === true &&
            <button
              className="md:hidden flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--text-secondary)', minWidth: 44, minHeight: 44 }}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Menu">
              
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            }

            {user ?
            <div className="hidden md:flex items-center gap-2">
                {EXTRA_NAV.map(({ path, icon: EIcon, label }) =>
              <Link key={path} to={path} title={label}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all"
              style={{ color: 'var(--text-muted)' }}>
                    <EIcon size={14} />
                    
                  </Link>
              )}
              </div> :

            <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="lx-btn-ghost text-sm py-1.5 px-3">Sign In</Link>
                <Link to="/register" className="lx-btn-primary text-sm py-1.5 px-3">Get Started</Link>
              </div>
            }
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen &&
      <div ref={menuRef} className="md:hidden fixed left-0 right-0 z-40 border-b shadow-lg overflow-y-auto"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', top: 'calc(3.5rem + env(safe-area-inset-top, 0px))', maxHeight: 'calc(100svh - 3.5rem - env(safe-area-inset-top, 0px))' }}>
          <nav className="px-4 py-3 space-y-1">
            {[...NAV_ITEMS, ...OTHER_NAV, ...EXTRA_NAV].map(({ path, icon: MIcon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all"
              style={{ color: active ? 'var(--lx-accent)' : 'var(--text-primary)', background: active ? 'var(--bg-elevated)' : 'transparent' }}>
                  <MIcon size={17} />
                  {label}
                </Link>);

          })}
            {!user &&
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                <Link to="/login" className="lx-btn-ghost text-sm flex-1 justify-center">Sign In</Link>
                <Link to="/register" className="lx-btn-primary text-sm flex-1 justify-center">Get Started</Link>
              </div>
          }
          </nav>
        </div>
      }

      {/* Pull-to-Refresh indicator */}
      {pullDistance > 0 &&
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-150 md:hidden"
        style={{ height: pullDistance, background: 'var(--bg-secondary)' }}>
        
          <div
          className={`w-6 h-6 rounded-full border-2 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
        
        </div>
      }

      {/* Main Content */}
      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto"
        className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0"
        style={{ overscrollBehavior: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
            e.preventDefault();
          }
        }}>
        
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full">
            
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {[
        { path: '/', icon: LayoutDashboard },
        { path: '/discover', icon: Compass },
        { path: '/chat', icon: MessageSquare }].
        map(({ path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
            className="flex-1 flex items-center justify-center"
            style={{ minHeight: 52, color: active ? 'var(--lx-accent)' : 'var(--text-muted)' }}>
              <Icon size={22} />
            </Link>);

        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex items-center justify-center"
          style={{ minHeight: 52, color: moreOpen ? 'var(--lx-accent)' : 'var(--text-muted)', background: 'transparent', border: 'none' }}>
          <Menu size={22} />
        </button>
      </nav>

      {/* Fullscreen More Menu */}
      {moreOpen &&
      <div className="md:hidden fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'var(--lx-border)' }}>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Navigation</span>
            <button onClick={() => setMoreOpen(false)}
          className="flex items-center justify-center rounded"
          style={{ minWidth: 44, minHeight: 44, color: 'var(--text-secondary)' }}>
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {[...NAV_ITEMS, ...OTHER_NAV, ...EXTRA_NAV].map(({ path, icon: MIcon, label }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl"
                style={{
                  background: active ? 'var(--lx-accent)' : 'var(--bg-card)',
                  color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--lx-accent)' : 'var(--lx-border)'}`
                }}>
                    <MIcon size={22} />
                    <span className="text-xs font-medium text-center">{label}</span>
                  </Link>);

            })}
            </div>
          </div>
        </div>
      }
    </div>);

}