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
import AppLockScreen from '@/components/safety/AppLockScreen.jsx';
import LibrarianChat from '@/components/librarian/LibrarianChat.jsx';

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

// Items available to add as icon-only buttons in the top bar (excludes bottom bar items)
const TOP_BAR_ICON_OPTIONS = [
{ path: '/library', icon: BookOpen, label: 'Library' },
{ path: '/reading-log', icon: Clock, label: 'Log' },
{ path: '/reviews', icon: Star, label: 'Reviews' },
{ path: '/clubs', icon: Users, label: 'Clubs' },
{ path: '/forums', icon: Newspaper, label: 'Forums' },
{ path: '/profile', icon: User, label: 'Profile' },
{ path: '/goal', icon: Target, label: 'Goal' },
{ path: '/quotes', icon: Quote, label: 'Quotes' },
{ path: '/challenges', icon: Trophy, label: 'Challenges' },
{ path: '/strength', icon: Zap, label: 'Strength' },
{ path: '/vault', icon: Lock, label: 'Vault' }];


const BOTTOM_NAV_ITEMS = [
{ path: '/', icon: LayoutDashboard, label: 'Home' },
{ path: '/discover', icon: Compass, label: 'Discover' },
{ path: '/library', icon: BookOpen, label: 'Library' },
{ path: '/reading-log', icon: Clock, label: 'Log' },
{ path: '/profile', icon: User, label: 'Profile' }];

const PATH_FEATURE_MAP = {
  '/vault': 'vault',
  '/forums': 'forums',
  '/clubs': 'clubs',
  '/chat': 'chat',
  '/reviews': 'reviews',
  '/wrapped': 'wrapped',
  '/discover': 'discover',
};


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
  const [appLocked, setAppLocked] = useState(false);
  const [librarianMode, setLibrarianMode] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [restrictedFeatures, setRestrictedFeatures] = useState([]);
  const [autoJoinedSchool, setAutoJoinedSchool] = useState(null);
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
      setRestrictedFeatures([]);
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
          // Enforce school age restriction — override member's age_filter
          if (s.age_restriction && s.age_restriction !== 'all') {
            const profile = p.find(x => x.username) || p[0];
            if (profile && profile.age_filter !== s.age_restriction) {
              try {
                await base44.entities.UserProfile.update(profile.id, { age_filter: s.age_restriction });
              } catch (e) {}
            }
          }

          // Compute student restrictions (school-wide + class-level + individual)
          let studentRestrictions = [...(s.restrictions || []), ...(activeSchoolMember.individual_restrictions || [])];
          try {
            const classes = await base44.entities.SchoolClass.filter({ school_id: s.id });
            const studentClasses = classes.filter(c => c.student_emails?.includes(user.email));
            for (const cls of studentClasses) {
              studentRestrictions.push(...(cls.restrictions || []));
            }
          } catch (e) {}
          setRestrictedFeatures([...new Set(studentRestrictions)]);
        }
      }

      // Check for school auto-join via email domain
      if (user?.email && !activeSchoolMember) {
        try {
          const res = await base44.functions.invoke('checkSchoolAutoJoin', {});
          if (res.data?.joined && res.data?.school) {
            setAutoJoinedSchool(res.data.school);
          }
        } catch (e) {}
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
    setProfileLoaded(true);
  }

  function handleTermsAccepted() {
    setNeedsTermsAccept(false);
  }

  // App Lock + Librarian Mode — initial check after profile loads
  useEffect(() => {
    if (profileLoaded && userProfile?.app_lock_enabled && userProfile?.app_lock_pin) {
      setAppLocked(true);
    }
    const lm = localStorage.getItem('lexio_librarian_mode') === 'true';
    setLibrarianMode(lm);
  }, [profileLoaded, userProfile]);

  // App Lock — re-lock when app returns to foreground (iOS resume)
  useEffect(() => {
    async function checkAppLock() {
      if (!user?.email || librarianMode) return;
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (profiles[0]?.app_lock_enabled && profiles[0]?.app_lock_pin) {
          setAppLocked(true);
        }
      } catch (e) {}
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') checkAppLock();
    }
    function handlePageShow(e) {
      if (e.persisted) checkAppLock();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [user, librarianMode]);

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

  // App Lock — full screen, takes priority over everything
  if (appLocked && userProfile?.app_lock_pin) {
    return <AppLockScreen pin={userProfile.app_lock_pin} onUnlock={() => setAppLocked(false)} />;
  }

  // Librarian Mode — kiosk chat, no personal data shown
  if (librarianMode && userProfile?.librarian_pin) {
    return <LibrarianChat pin={userProfile.librarian_pin} onExit={() => setLibrarianMode(false)} />;
  }

  // Brief loading while profile loads (prevents flash before app lock kicks in)
  if (user && !profileLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const isRestricted = (path) => {
    const feature = PATH_FEATURE_MAP[path];
    return feature ? restrictedFeatures.includes(feature) : false;
  };
  const allNavItems = [...NAV_ITEMS, ...OTHER_NAV, ...EXTRA_NAV].filter(item => !isRestricted(item.path));
  const visibleExtraNav = EXTRA_NAV.filter(item => !isRestricted(item.path));
  const visibleTopBarIcons = TOP_BAR_ICON_OPTIONS.filter(item => !isRestricted(item.path));
  const visibleBottomNav = [
    { path: '/', icon: LayoutDashboard },
    { path: '/discover', icon: Compass },
    { path: '/chat', icon: MessageSquare }
  ].filter(({ path }) => !isRestricted(path));
  const visibleDesktopNav = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
  ].filter(({ path }) => !isRestricted(path));

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
        autoJoinedSchool={autoJoinedSchool}
        onComplete={() => {setShowTour(false);setForceTour(false);setAutoJoinedSchool(null);loadUserProfile();}} />
      }
      {/* Top Nav — logo far left, extra icons center, notification far right; invisible spacer when hidden */}
      <header className="sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', background: prefs?.hide_top_bar ? 'transparent' : 'var(--bg-secondary)', borderBottom: prefs?.hide_top_bar ? 'none' : '1px solid var(--lx-border)' }}>
        {prefs?.hide_top_bar ? null : (
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo — far left */}
          <Link to="/" onClick={() => {setMobileMenuOpen(false);mainRef.current?.scrollTo({ top: 0 });}} className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
              alt="Lexio"
              className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-display font-bold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>Lexio</span>
          </Link>

          {/* Center: user-selected extra icons (icon-only, all sizes) + desktop nav */}
          <div className="flex items-center gap-0.5">
            {visibleTopBarIcons.filter(opt => prefs?.top_bar_icons?.includes(opt.path)).map(({ path, icon: NavIcon, label }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} title={label}
                  className="flex items-center justify-center rounded transition-colors"
                  style={{ color: active ? 'var(--lx-accent)' : 'var(--text-secondary)', minWidth: 36, minHeight: 36, background: active ? 'var(--bg-elevated)' : 'transparent' }}>
                  <NavIcon size={16} />
                </Link>
              );
            })}

            {/* Desktop/Landscape Nav — items with labels + all-pages menu */}
            <nav className="hidden md:flex items-center gap-0.5 ml-1">
              {visibleDesktopNav.map(({ path, icon: NavIcon, label }) => {
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
                  {allNavItems.map(({ path, icon: OIcon, label }) =>
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
          </div>

          {/* Right: notification bell far right */}
          <div className="flex items-center gap-2">
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
                {visibleExtraNav.map(({ path, icon: EIcon, label }) =>
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
            {user && <NotificationBell user={user} />}
          </div>
        </div>
        )}
      </header>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen &&
      <div ref={menuRef} className="md:hidden fixed left-0 right-0 z-40 border-b shadow-lg overflow-y-auto"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', top: 'calc(3.5rem + env(safe-area-inset-top, 0px))', maxHeight: 'calc(100svh - 3.5rem - env(safe-area-inset-top, 0px))' }}>
          <nav className="px-4 py-3 space-y-1">
            {allNavItems.map(({ path, icon: MIcon, label }) => {
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
        className="flex-1 min-h-0 overflow-y-auto safe-bottom"
        style={{ overscrollBehavior: 'none', ...(prefs?.hide_top_bar ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' } : {}) }}
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

      {/* Mobile Bottom Tab Bar — shown on all sizes when top bar is hidden */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t flex ${prefs?.hide_top_bar ? '' : 'md:hidden'}`}
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {visibleBottomNav.map(({ path, icon: Icon }) => {
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
            <div className="flex items-center gap-1">
              {prefs?.hide_top_bar && user && <NotificationBell user={user} />}
              <button onClick={() => setMoreOpen(false)}
            className="flex items-center justify-center rounded"
            style={{ minWidth: 44, minHeight: 44, color: 'var(--text-secondary)' }}>
                <X size={22} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {allNavItems.map(({ path, icon: MIcon, label }) => {
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