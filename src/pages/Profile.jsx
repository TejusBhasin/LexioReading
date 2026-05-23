import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import { applyTheme } from '@/lib/theme';
import AppLayout from '@/components/layout/AppLayout';
import { User, BookOpen, MessageSquare, Palette, Settings, Lock } from 'lucide-react';

const GENRES = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Historical', 'Biography', 'Self-Help', 'Horror', 'Literary Fiction', 'Philosophy', 'Science', 'Psychology'];
const MOODS = ['Thought-provoking', 'Escapist', 'Inspirational', 'Dark & Gritty', 'Heartwarming', 'Funny', 'Suspenseful', 'Lyrical', 'Action-packed'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'history', label: 'Chat History', icon: MessageSquare },
  { id: 'personalization', label: 'Appearance', icon: Palette },
];

export default function Profile() {
  const { user, logout } = useLexioAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [prefs, setPrefs] = useState(null);
  const [prefsId, setPrefsId] = useState(null);
  const [library, setLibrary] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (user) {
      loadAll();
    }
  }, [user]);

  async function loadAll() {
    const [prefsArr, libraryArr, chatArr] = await Promise.all([
      base44.entities.UserPreferences.filter({ user_email: user.email }),
      base44.entities.UserLibrary.filter({ user_email: user.email }),
      base44.entities.ChatMessage.filter({ user_email: user.email }, '-created_date', 50),
    ]);
    if (prefsArr.length > 0) {
      setPrefs(prefsArr[0]);
      setPrefsId(prefsArr[0].id);
    } else {
      setPrefs({ user_email: user.email, favorite_genres: [], disliked_genres: [], moods: [], pacing: 'any', difficulty: 'any', theme_mode: 'bold', color_scheme: 'dark' });
    }
    setLibrary(libraryArr);
    setChatHistory(chatArr);
  }

  async function savePrefs() {
    if (!prefs) return;
    setSaving(true);
    try {
      if (prefsId) {
        await base44.entities.UserPreferences.update(prefsId, prefs);
      } else {
        const created = await base44.entities.UserPreferences.create({ ...prefs, user_email: user.email });
        setPrefsId(created.id);
      }
      applyTheme(prefs);
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch {}
    setSaving(false);
  }

  function updatePrefs(key, value) {
    setPrefs(p => ({ ...p, [key]: value }));
  }

  function togglePrefArray(key, item) {
    setPrefs(p => ({
      ...p,
      [key]: (p[key] || []).includes(item) ? (p[key] || []).filter(x => x !== item) : [...(p[key] || []), item]
    }));
  }

  const stats = {
    total: library.length,
    finished: library.filter(b => b.status === 'finished').length,
    reading: library.filter(b => b.status === 'reading').length,
    wantToRead: library.filter(b => b.status === 'want_to_read').length,
    avgRating: library.filter(b => b.rating).length > 0
      ? (library.filter(b => b.rating).reduce((a, b) => a + b.rating, 0) / library.filter(b => b.rating).length).toFixed(1)
      : '—',
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock size={48} className="mx-auto mb-6" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-3xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Your Profile</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>Sign up to access your preferences, stats, and AI chat history.</p>
          <Link to="/signup" className="inline-flex px-8 py-4 rounded-xl font-black text-sm" style={{ background: 'var(--accent-primary)', color: '#000' }}>
            Create Free Account
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: 'var(--accent-primary)', color: '#000' }}>
            {(user.full_name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{user.full_name || 'Reader'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-bold"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Books', value: stats.total },
                { label: 'Finished', value: stats.finished },
                { label: 'Reading Now', value: stats.reading },
                { label: 'Avg Rating', value: stats.avgRating },
              ].map(s => (
                <div key={s.label} className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent-primary)' }}>{s.value}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent library */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <div className="px-5 py-4" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>Recent Books</h3>
              </div>
              {library.slice(0, 5).map(book => (
                <div key={book.id} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <div className="w-10 h-14 rounded overflow-hidden shrink-0" style={{ background: 'var(--bg-card)' }}>
                    {book.book_cover ? <img src={book.book_cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">📚</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{book.book_title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{book.book_author}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                    {book.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
              {library.length === 0 && (
                <div className="px-5 py-8 text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No books in your library yet.</p>
                  <Link to="/" className="text-sm font-bold mt-2 block" style={{ color: 'var(--accent-primary)' }}>Discover books →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && prefs && (
          <div className="space-y-8">
            <div>
              <h3 className="font-black mb-4 text-lg" style={{ color: 'var(--text-primary)' }}>Favorite Genres</h3>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button key={g} onClick={() => togglePrefArray('favorite_genres', g)}
                    className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                    style={{
                      background: (prefs.favorite_genres || []).includes(g) ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: (prefs.favorite_genres || []).includes(g) ? '#000' : 'var(--text-secondary)',
                      border: '2px solid ' + ((prefs.favorite_genres || []).includes(g) ? 'var(--accent-primary)' : 'var(--border-color)'),
                    }}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-black mb-4 text-lg" style={{ color: 'var(--text-primary)' }}>Reading Moods</h3>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button key={m} onClick={() => togglePrefArray('moods', m)}
                    className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                    style={{
                      background: (prefs.moods || []).includes(m) ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: (prefs.moods || []).includes(m) ? '#000' : 'var(--text-secondary)',
                      border: '2px solid ' + ((prefs.moods || []).includes(m) ? 'var(--accent-primary)' : 'var(--border-color)'),
                    }}>{m}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <h3 className="font-black mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Pacing</h3>
                <div className="flex gap-2 flex-wrap">
                  {['fast', 'medium', 'slow', 'any'].map(p => (
                    <button key={p} onClick={() => updatePrefs('pacing', p)}
                      className="px-4 py-2 rounded-full text-sm font-bold"
                      style={{ background: prefs.pacing === p ? 'var(--accent-primary)' : 'var(--bg-card)', color: prefs.pacing === p ? '#000' : 'var(--text-secondary)', border: '2px solid var(--border-color)' }}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-black mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Difficulty</h3>
                <div className="flex gap-2 flex-wrap">
                  {['light', 'medium', 'challenging', 'any'].map(d => (
                    <button key={d} onClick={() => updatePrefs('difficulty', d)}
                      className="px-4 py-2 rounded-full text-sm font-bold"
                      style={{ background: prefs.difficulty === d ? 'var(--accent-primary)' : 'var(--bg-card)', color: prefs.difficulty === d ? '#000' : 'var(--text-secondary)', border: '2px solid var(--border-color)' }}
                    >{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={savePrefs} disabled={saving}
              className="px-8 py-3 rounded-xl font-black text-sm transition-all"
              style={{ background: 'var(--accent-primary)', color: '#000', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : savedMsg || 'Save Preferences'}
            </button>
          </div>
        )}

        {/* Chat History */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Chat History</h2>
            {chatHistory.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No chat history yet.</p>
                <Link to="/chat" className="mt-4 inline-block text-sm font-black" style={{ color: 'var(--accent-primary)' }}>Start chatting →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map(msg => (
                  <div key={msg.id} className="flex gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black"
                      style={{ background: msg.role === 'user' ? 'var(--bg-hover)' : 'var(--accent-primary)', color: msg.role === 'user' ? 'var(--text-secondary)' : '#000' }}>
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--text-primary)' }}>{msg.content}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {msg.created_date ? new Date(msg.created_date).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personalization */}
        {activeTab === 'personalization' && prefs && (
          <div className="space-y-8">
            <div>
              <h3 className="font-black mb-4 text-lg" style={{ color: 'var(--text-primary)' }}>Base Style</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'bold', label: 'Bold', desc: 'High contrast, strong shadows, Gumroad-style energy' },
                  { value: 'minimal', label: 'Minimal', desc: 'Clean, refined, modern SaaS aesthetic' },
                ].map(t => (
                  <button key={t.value} onClick={() => updatePrefs('theme_mode', t.value)}
                    className="p-5 rounded-2xl text-left transition-all"
                    style={{
                      background: 'var(--bg-card)',
                      border: '2px solid ' + (prefs.theme_mode === t.value ? 'var(--accent-primary)' : 'var(--border-color)'),
                    }}>
                    <div className="font-black mb-1" style={{ color: prefs.theme_mode === t.value ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{t.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-black mb-4 text-lg" style={{ color: 'var(--text-primary)' }}>Color Scheme</h3>
              <div className="flex gap-3">
                {[
                  { value: 'dark', label: '🌙 Dark' },
                  { value: 'light', label: '☀️ Light' },
                ].map(s => (
                  <button key={s.value} onClick={() => updatePrefs('color_scheme', s.value)}
                    className="px-6 py-3 rounded-xl font-black text-sm"
                    style={{
                      background: prefs.color_scheme === s.value ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: prefs.color_scheme === s.value ? '#000' : 'var(--text-secondary)',
                      border: '2px solid ' + (prefs.color_scheme === s.value ? 'var(--accent-primary)' : 'var(--border-color)'),
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-black mb-4 text-lg" style={{ color: 'var(--text-primary)' }}>Custom Colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'custom_primary', label: 'Accent (Primary)' },
                  { key: 'custom_accent', label: 'Accent (Secondary)' },
                  { key: 'custom_secondary', label: 'Accent (Tertiary)' },
                ].map(c => (
                  <div key={c.key}>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>{c.label}</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <input
                        type="color"
                        value={prefs[c.key] || '#f5a623'}
                        onChange={e => updatePrefs(c.key, e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{prefs[c.key] || 'Default'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPrefs(p => ({ ...p, custom_primary: null, custom_accent: null, custom_secondary: null }))}
                className="mt-3 text-xs font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                Reset to defaults
              </button>
            </div>

            {/* Live preview */}
            <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h4 className="font-black mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Preview</h4>
              <div className="flex gap-3">
                <div className="w-12 h-16 rounded-lg" style={{ background: prefs.custom_primary || 'var(--accent-primary)' }} />
                <div className="w-12 h-16 rounded-lg" style={{ background: prefs.custom_accent || 'var(--accent-secondary)' }} />
                <div className="w-12 h-16 rounded-lg" style={{ background: prefs.custom_secondary || 'var(--accent-tertiary)' }} />
              </div>
            </div>

            <button onClick={savePrefs} disabled={saving}
              className="px-8 py-3 rounded-xl font-black text-sm transition-all"
              style={{ background: 'var(--accent-primary)', color: '#000', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Applying...' : savedMsg || 'Apply Theme'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}