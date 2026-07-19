import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, MessageSquare, Palette, Settings, LogOut, Check, Download, GraduationCap, Shield, Trash2, Upload, Copy, Link2, Library, Lock, Smartphone, Clock, Star, Users, Newspaper, Target, Quote, Trophy, Zap } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SetupTour from '@/components/onboarding/SetupTour';
import ContactForm from '@/components/profile/ContactForm';
import ProfileExport from '@/components/profile/ProfileExport';
import JoinCreateSchool from '@/components/schools/JoinCreateSchool';
import SchoolCodeEntry from '@/components/schools/SchoolCodeEntry';
import SchoolClassManager from '@/components/schools/SchoolClassManager';
import PrivacyTab from '@/components/profile/PrivacyTab';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import LibrarianSettings from '@/components/profile/LibrarianSettings';
import AppLockSettings from '@/components/profile/AppLockSettings';
import AppStoreBadge from '@/components/onboarding/AppStoreBadge';
import AppFooter from '@/components/layout/AppFooter';

import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { applyTheme, GENRE_OPTIONS, MOOD_OPTIONS } from '@/lib/theme';
import { detectPlatform } from '@/lib/platformDetect';
import { APP_CONFIG } from '@/lib/appConfig';

const TABS = [
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'stats', label: 'Stats', icon: BookOpen },
  { id: 'privacy', label: 'Privacy', icon: User },
  { id: 'history', label: 'Chat History', icon: MessageSquare },
  { id: 'theme', label: 'Personalize', icon: Palette },
  { id: 'data', label: 'Import & Export', icon: Upload },
  { id: 'export', label: 'Export Card', icon: Download },
  { id: 'school', label: 'School', icon: GraduationCap },
  { id: 'librarian', label: 'Librarian', icon: Library },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'admin', label: 'Admin', icon: Shield },
];

const PACING_OPTIONS = [
  { value: 'fast', label: 'Fast-paced' },
  { value: 'medium', label: 'Balanced' },
  { value: 'slow', label: 'Slow burn' },
  { value: 'any', label: 'No preference' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'light', label: 'Light reading' },
  { value: 'medium', label: 'Medium' },
  { value: 'challenging', label: 'Challenging' },
  { value: 'any', label: 'No preference' },
];

const PRESET_COLORS = [
  { name: 'Golden', primary: '#e8c547', accent: '#c4433a', secondary: '#2a2a1a' },
  { name: 'Indigo', primary: '#6366f1', accent: '#06b6d4', secondary: '#1e1e2e' },
  { name: 'Rose', primary: '#f43f5e', accent: '#fb7185', secondary: '#2a1a1a' },
  { name: 'Emerald', primary: '#10b981', accent: '#34d399', secondary: '#0a1a14' },
  { name: 'Orange', primary: '#f97316', accent: '#fb923c', secondary: '#1a1000' },
];

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
  { path: '/vault', icon: Lock, label: 'Vault' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [tab, setTab] = useState('preferences');
  const [profileUsername, setProfileUsername] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [library, setLibrary] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadAll();
      base44.entities.UserProfile.filter({ user_email: user.email }).then(p => {
        if (p[0]) {
          setProfileUsername(p[0].username || null);
          setUserProfileData(p[0]);
        }
      }).catch(() => {});
    }
  }, [user]);

  function reloadProfile() {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(p => {
      if (p[0]) {
        setProfileUsername(p[0].username || null);
        setUserProfileData(p[0]);
      }
    }).catch(() => {});
  }

  async function loadAll() {
    try {
      const [p, lib, msgs] = await Promise.all([
        base44.entities.UserPreferences.filter({ user_email: user.email }),
        base44.entities.UserLibrary.filter({ user_email: user.email }),
        base44.entities.ChatMessage.filter({ user_email: user.email }, '-created_date', 200),
      ]);

      if (p.length > 0) {
        setPrefs(p[0]);
      } else {
        setPrefs({
          user_email: user.email,
          theme_mode: 'bold',
          color_scheme: 'dark',
          favorite_genres: [],
          disliked_genres: [],
          favorite_books: [],
          moods: [],
          pacing: 'any',
          difficulty: 'any',
          disliked_content: [],
        });
      }
      setLibrary(lib);

      // Group messages into sessions
      const sessMap = {};
      msgs.forEach(m => {
        const sid = m.session_id || 'default';
        if (!sessMap[sid]) {
          sessMap[sid] = { id: sid, messages: [], date: m.created_date, title: m.session_title || 'Chat' };
        }
        sessMap[sid].messages.push(m);
      });
      setChatSessions(Object.values(sessMap).sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {}
  }

  async function savePrefs() {
    if (!prefs) return;
    setSaving(true);
    try {
      if (prefs.id) {
        await base44.entities.UserPreferences.update(prefs.id, prefs);
      } else {
        const newP = await base44.entities.UserPreferences.create({ ...prefs, user_email: user.email });
        setPrefs(newP);
      }
      applyTheme(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {}
    setSaving(false);
  }

  function toggleGenre(genre) {
    setPrefs(prev => ({
      ...prev,
      favorite_genres: prev.favorite_genres?.includes(genre)
        ? prev.favorite_genres.filter(g => g !== genre)
        : [...(prev.favorite_genres || []), genre]
    }));
  }

  function toggleMood(mood) {
    setPrefs(prev => ({
      ...prev,
      moods: prev.moods?.includes(mood)
        ? prev.moods.filter(m => m !== mood)
        : [...(prev.moods || []), mood]
    }));
  }

  function applyPreset(preset) {
    const updated = { ...prefs, custom_primary: preset.primary, custom_accent: preset.accent, custom_secondary: preset.secondary };
    setPrefs(updated);
    applyTheme(updated);
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <User size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Your Profile</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to access preferences, chat history, and personalization.</p>
        <a href="/login" className="lx-btn-primary">Sign In</a>
      </div>
    );
  }

  const stats = {
    total: library.length,
    finished: library.filter(b => b.status === 'finished').length,
    reading: library.filter(b => b.status === 'reading').length,
    want: library.filter(b => b.status === 'want_to_read').length,
    avgRating: library.filter(b => b.rating).reduce((s, b) => s + b.rating, 0) / (library.filter(b => b.rating).length || 1),
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ touchAction: 'manipulation' }}>
      {showTour && user && (
        <SetupTour
          user={user}
          userProfile={userProfileData}
          onComplete={() => {
            setShowTour(false);
            base44.entities.UserProfile.filter({ user_email: user.email }).then(p => {
              if (p[0]) { setUserProfileData(p[0]); setProfileUsername(p[0].username || null); }
            }).catch(() => {});
          }}
        />
      )}
    <div className="flex-1 max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center font-display text-xl font-bold flex-shrink-0"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {user?.full_name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name || 'Reader'}
            </h1>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => logout()} className="lx-btn-ghost text-sm py-1.5">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* Download App Store — web & PWA only, hidden in native app */}
      {!detectPlatform().isNativeApp && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lx-accent)' }}>
            <Smartphone size={18} style={{ color: 'var(--bg-primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Get the iPhone App</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Faster performance, native notifications, and more.</p>
          </div>
          <AppStoreBadge onClick={() => {
            try { base44.analytics.track({ eventName: 'profile_appstore_clicked' }); } catch (e) {}
            window.open(APP_CONFIG.appStoreUrl, '_blank', 'noopener,noreferrer');
          }} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.filter(t => t.id !== 'admin' || user?.role === 'admin').map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === id ? 'var(--lx-accent)' : 'var(--bg-card)',
              color: tab === id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${tab === id ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}
          >
            <TabIcon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* PREFERENCES */}
      {tab === 'preferences' && prefs && (
        <div className="space-y-8">
          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Favorite Genres</h3>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map(g => {
                const selected = prefs.favorite_genres?.includes(g);
                return (
                  <button key={g} onClick={() => toggleGenre(g)}
                    className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                    style={{
                      background: selected ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: selected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {selected && <Check size={11} className="inline mr-1" />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Reading Moods</h3>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map(m => {
                const selected = prefs.moods?.includes(m);
                return (
                  <button key={m} onClick={() => toggleMood(m)}
                    className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                    style={{
                      background: selected ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: selected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Pacing</h3>
              <div className="flex flex-col gap-2">
                {PACING_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setPrefs(p => ({ ...p, pacing: opt.value }))}
                    className="text-left px-3 py-2 rounded text-sm transition-all"
                    style={{
                      background: prefs.pacing === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: prefs.pacing === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${prefs.pacing === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Difficulty</h3>
              <div className="flex flex-col gap-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setPrefs(p => ({ ...p, difficulty: opt.value }))}
                    className="text-left px-3 py-2 rounded text-sm transition-all"
                    style={{
                      background: prefs.difficulty === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: prefs.difficulty === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${prefs.difficulty === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Discover Page Sections</h3>
            <div className="space-y-3">
              {[
                { key: 'show_recommendations', label: 'AI Recommendations', desc: 'Show personalized book picks in Discover' },
                { key: 'show_popular', label: 'Popular & Trending', desc: 'Show trending books section in Discover' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: prefs[key] !== false ? 'var(--lx-accent)' : 'var(--border-strong)' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: prefs[key] !== false ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={savePrefs} disabled={saving} className="lx-btn-primary">
              {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button onClick={() => setShowTour(true)} className="lx-btn-ghost text-sm">
              🗺️ Retake Setup Tour
            </button>
          </div>
        </div>
      )}

      {/* STATS */}
      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Books', value: stats.total },
              { label: 'Finished', value: stats.finished },
              { label: 'Reading', value: stats.reading },
              { label: 'Want to Read', value: stats.want },
            ].map(s => (
              <div key={s.label} className="lx-card p-5 text-center">
                <div className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--lx-accent)' }}>
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {stats.avgRating > 0 && (
            <div className="lx-card p-5">
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Average Rating</p>
              <p className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>
                {stats.avgRating.toFixed(1)} / 5
              </p>
            </div>
          )}

          {library.filter(b => b.status === 'finished').length > 0 && (
            <div>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Recently Finished</h3>
              <div className="space-y-2">
                {library.filter(b => b.status === 'finished').slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                    {b.book_cover && <img src={b.book_cover} alt={b.book_title} className="w-8 h-12 object-cover rounded" />}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.book_title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.book_author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRIVACY */}
      {tab === 'privacy' && (
        <div className="space-y-6">
          {profileUsername && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lx-accent)' }}>
                  <Link2 size={18} style={{ color: 'var(--bg-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Share Profile Link</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Copy your public profile link to share with friends.</p>
                  <p className="text-xs font-mono mb-3 truncate p-2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {window.location.origin}/u/{profileUsername}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/u/${profileUsername}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="lx-btn-primary text-sm"
                  >
                    {linkCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Profile Link</>}
                  </button>
                </div>
              </div>
            </div>
          )}
          <PrivacyTab user={user} />
        </div>
      )}

      {/* CHAT HISTORY */}
      {tab === 'history' && (
        <div>
          {chatSessions.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No chat history yet.</p>
              <Link to="/chat" className="inline-block mt-4 lx-btn-primary text-sm">Start Chatting</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {chatSessions.map(s => (
                <Link
                  key={s.id}
                  to={`/chat?session=${s.id}`}
                  className="block lx-card p-4 hover:border-accent"
                  style={{ borderColor: 'var(--lx-border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {s.title || 'Chat Session'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {s.messages[0]?.content?.slice(0, 100) || 'No messages'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.messages.length} messages
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-6">
          {/* Import */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lx-accent)' }}>
                <Upload size={18} style={{ color: 'var(--bg-primary)' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Import from Goodreads</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Bring your entire Goodreads library — books, ratings, reviews, shelves, and reading dates — into Lexio in one click.</p>
                <Link to="/import" className="lx-btn-primary text-sm inline-flex">
                  <Upload size={14} /> Open Import Tool
                </Link>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <Download size={18} style={{ color: 'var(--lx-accent)' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Export Your Data</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Download your library, reading logs, quotes, and reviews as CSV files. Your data always belongs to you.</p>
                <Link to="/import" className="lx-btn-ghost text-sm inline-flex">
                  <Download size={14} /> Open Export Tool
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <ProfileExport user={user} />
      )}

      {tab === 'school' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>School Mode</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Schools are managed environments for teachers and students. Joining is permanent, but your data always stays with you.</p>
          </div>
          <JoinCreateSchool user={user} />
          <SchoolClassManager user={user} />
          {/* Link to admin panel */}
          <a href="/school-admin" className="lx-btn-ghost text-sm flex items-center gap-2 w-full justify-center">
            <GraduationCap size={14} /> Manage My School (Admin Panel)
          </a>
          {/* Link to teacher classes */}
          <Link to="/my-classes" className="lx-btn-ghost text-sm flex items-center gap-2 w-full justify-center">
            <BookOpen size={14} /> My Classes (Teacher)
          </Link>
        </div>
      )}

      {tab === 'admin' && (
        <AdminDashboard user={user} />
      )}

      {/* THEME */}
      {tab === 'theme' && prefs && (
        <div className="space-y-8">
          {/* Mode */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Design Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bold', label: 'Bold', desc: 'High contrast, strong typography, Gumroad-style' },
                { value: 'minimal', label: 'Minimal', desc: 'Clean, airy, refined spacing' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const updated = { ...prefs, theme_mode: opt.value };
                    setPrefs(updated);
                    applyTheme(updated);
                  }}
                  className="text-left p-4 rounded-lg transition-all"
                  style={{
                    background: prefs.theme_mode === opt.value ? 'var(--lx-accent)' : 'var(--bg-card)',
                    color: prefs.theme_mode === opt.value ? 'var(--bg-primary)' : 'var(--text-primary)',
                    border: `2px solid ${prefs.theme_mode === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  }}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-xs mt-1" style={{ opacity: 0.8 }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Color Scheme</h3>
            <div className="flex gap-2">
              {[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }].map(opt => (
                <button key={opt.value}
                  onClick={() => { const updated = { ...prefs, color_scheme: opt.value }; setPrefs(updated); applyTheme(updated); }}
                  className="px-5 py-2 rounded font-medium transition-all"
                  style={{ background: prefs.color_scheme === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: prefs.color_scheme === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${prefs.color_scheme === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Color Presets</h3>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map(preset => (
                <button key={preset.name} onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2 px-3 py-2 rounded transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: preset.accent }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Custom Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {[{ key: 'custom_primary', label: 'Primary Accent' }, { key: 'custom_accent', label: 'Secondary Accent' }, { key: 'custom_secondary', label: 'Background Tone' }].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={prefs[key] || '#e8c547'}
                      onChange={e => { const updated = { ...prefs, [key]: e.target.value }; setPrefs(updated); applyTheme(updated); }}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0.5" style={{ background: 'var(--bg-elevated)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{prefs[key] || '#e8c547'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interface options */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Interface</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Hide top bar</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Remove the top navigation bar for a cleaner, full-screen experience. Bottom tab bar remains for navigation.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, hide_top_bar: !p.hide_top_bar }))}
                  className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative ml-4"
                  style={{ background: prefs.hide_top_bar ? 'var(--lx-accent)' : 'var(--border-strong)' }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: prefs.hide_top_bar ? '22px' : '2px' }} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Show top menu button</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Show the ☰ hamburger button in the top bar on mobile (in addition to the bottom nav)</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, show_top_hamburger: !p.show_top_hamburger }))}
                  className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative ml-4"
                  style={{ background: prefs.show_top_hamburger ? 'var(--lx-accent)' : 'var(--border-strong)' }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: prefs.show_top_hamburger ? '22px' : '2px' }} />
                </button>
              </div>
              {/* Top bar extra icons selector */}
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Top bar icons</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Add quick-access icons to the top bar (items not in your bottom bar). Icon-only, no text.</p>
                <div className="flex flex-wrap gap-2">
                  {TOP_BAR_ICON_OPTIONS.map(({ path, icon: Icon, label }) => {
                    const selected = prefs.top_bar_icons?.includes(path);
                    return (
                      <button key={path} onClick={() => setPrefs(p => ({
                        ...p,
                        top_bar_icons: p.top_bar_icons?.includes(path)
                          ? p.top_bar_icons.filter(x => x !== path)
                          : [...(p.top_bar_icons || []), path]
                      }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all"
                        style={{
                          background: selected ? 'var(--lx-accent)' : 'var(--bg-card)',
                          color: selected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                        }}>
                        {selected && <Check size={11} />}
                        <Icon size={13} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button onClick={savePrefs} disabled={saving} className="lx-btn-primary">
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      )}

      {/* Librarian Mode */}
      {tab === 'librarian' && user && (
        <LibrarianSettings user={user} userProfile={userProfileData} onUpdate={reloadProfile} />
      )}

      {/* Security / App Lock */}
      {tab === 'security' && user && (
        <AppLockSettings user={user} userProfile={userProfileData} onUpdate={reloadProfile} />
      )}

      {/* Delete Account */}
      {user && <DeleteAccountSection user={user} />}

      {/* Contact Us */}
      {user && (
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--lx-border)' }}>
          <ContactForm user={user} />
        </div>
      )}

      {/* School Creation Code Entry */}
      {user && (
        <div className="mt-8">
          <SchoolCodeEntry user={user} />
        </div>
      )}

      {/* Footer with App Store + Links */}
      <div className="mt-12 -mx-4">
        <AppFooter />
      </div>
    </div>
    <div className="flex-shrink-0 text-center py-1.5 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--lx-border)', background: 'var(--bg-secondary)' }}>
      Questions? Concerns? Support?{' '}
      <a href="mailto:Support@LexioReading.App" style={{ color: 'var(--lx-accent)' }}>
        Email Support@LexioReading.App
      </a>
    </div>
    </div>
  );
}