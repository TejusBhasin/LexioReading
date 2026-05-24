import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, MessageSquare, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { applyTheme } from '@/lib/theme';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function AppShell({ children, user }) {
  const location = useLocation();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (user?.email) {
      loadPrefs();
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

  return (
    <div className="min-h-screen lx-bg flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)' }}>
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
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:block" style={{ color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="lx-btn-ghost text-sm py-1.5 px-3">Sign In</Link>
                <Link to="/signup" className="lx-btn-primary text-sm py-1.5 px-3">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 page-enter">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)' }}>
        {NAV_ITEMS.map(({ path, icon: MobIcon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-all"
              style={{ color: active ? 'var(--lx-accent)' : 'var(--text-muted)' }}
            >
              <MobIcon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}