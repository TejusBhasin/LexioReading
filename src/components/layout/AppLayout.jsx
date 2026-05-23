import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLexioAuth } from '@/lib/authContext';
import { base44 } from '@/api/base44Client';
import { applyTheme } from '@/lib/theme';
import { Compass, BookOpen, MessageSquare, User, LogOut, Zap } from 'lucide-react';

export default function AppLayout({ children }) {
  const { user, logout } = useLexioAuth();
  const location = useLocation();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (user) loadPrefs();
    else applyTheme({ theme_mode: 'bold', color_scheme: 'dark' });
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
    } catch {
      applyTheme({ theme_mode: 'bold', color_scheme: 'dark' });
    }
  }

  const navItems = [
    { path: '/', icon: Compass, label: 'Discover' },
    { path: '/library', icon: BookOpen, label: 'Library' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="lexio-app min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Nav */}
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }} className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/user_6a12376d0f4ca5762da03b88/1678f5c8f_Lexio.png" alt="Lexio" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive(item.path) ? 'var(--accent-primary)' : 'transparent',
                  color: isActive(item.path) ? '#000' : 'var(--text-secondary)',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                  {user.full_name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <LogOut size={14} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{ color: 'var(--text-secondary)' }}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-bold rounded-lg transition-all"
                  style={{ background: 'var(--accent-primary)', color: '#000' }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-3"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1"
            style={{ color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          >
            <item.icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="pt-16 pb-20 md:pb-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}