import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLexioAuth } from '@/lib/authContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const GENRES = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Historical', 'Biography', 'Self-Help', 'Horror', 'Literary Fiction', 'Philosophy', 'Science', 'Psychology'];
const MOODS = ['Thought-provoking', 'Escapist', 'Inspirational', 'Dark & Gritty', 'Heartwarming', 'Funny', 'Suspenseful', 'Lyrical', 'Action-packed'];
const PACING = ['Fast-paced', 'Medium', 'Slow-burn', 'No preference'];
const DIFFICULTY = ['Light & Easy', 'Medium', 'Challenging', 'No preference'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useLexioAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    favorite_genres: [],
    disliked_genres: [],
    moods: [],
    pacing: 'any',
    difficulty: 'any',
    favorite_books: '',
    disliked_content: [],
  });

  const toggleItem = (field, item) => {
    setPrefs(p => ({
      ...p,
      [field]: p[field].includes(item) ? p[field].filter(x => x !== item) : [...p[field], item]
    }));
  };

  const steps = [
    {
      title: "What genres do you love?",
      subtitle: "Pick everything that resonates.",
      content: (
        <div className="flex flex-wrap gap-3">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleItem('favorite_genres', g)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: prefs.favorite_genres.includes(g) ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: prefs.favorite_genres.includes(g) ? '#000' : 'var(--text-secondary)',
                border: '2px solid ' + (prefs.favorite_genres.includes(g) ? 'var(--accent-primary)' : 'var(--border-color)'),
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Any genres you avoid?",
      subtitle: "This helps us filter out stuff you won't enjoy.",
      content: (
        <div className="flex flex-wrap gap-3">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleItem('disliked_genres', g)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: prefs.disliked_genres.includes(g) ? '#ef4444' : 'var(--bg-card)',
                color: prefs.disliked_genres.includes(g) ? '#fff' : 'var(--text-secondary)',
                border: '2px solid ' + (prefs.disliked_genres.includes(g) ? '#ef4444' : 'var(--border-color)'),
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "What mood fits your reading?",
      subtitle: "Select the vibes you gravitate toward.",
      content: (
        <div className="flex flex-wrap gap-3">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => toggleItem('moods', m)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: prefs.moods.includes(m) ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: prefs.moods.includes(m) ? '#000' : 'var(--text-secondary)',
                border: '2px solid ' + (prefs.moods.includes(m) ? 'var(--accent-primary)' : 'var(--border-color)'),
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Pacing & Difficulty",
      subtitle: "How do you like your reads?",
      content: (
        <div className="space-y-8">
          <div>
            <p className="font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Pacing</p>
            <div className="flex flex-wrap gap-3">
              {PACING.map(p => (
                <button
                  key={p}
                  onClick={() => setPrefs(prev => ({ ...prev, pacing: p.toLowerCase().replace(' & ', '_').replace(' ', '_').replace('-', '_') }))}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: prefs.pacing === p.toLowerCase().replace(' & ', '_').replace(' ', '_').replace('-', '_') ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: prefs.pacing === p.toLowerCase().replace(' & ', '_').replace(' ', '_').replace('-', '_') ? '#000' : 'var(--text-secondary)',
                    border: '2px solid var(--border-color)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Difficulty</p>
            <div className="flex flex-wrap gap-3">
              {DIFFICULTY.map(d => (
                <button
                  key={d}
                  onClick={() => setPrefs(prev => ({ ...prev, difficulty: d.toLowerCase().replace(' & ', '_').replace(' ', '_') }))}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: prefs.difficulty === d.toLowerCase().replace(' & ', '_').replace(' ', '_') ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: prefs.difficulty === d.toLowerCase().replace(' & ', '_').replace(' ', '_') ? '#000' : 'var(--text-secondary)',
                    border: '2px solid var(--border-color)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Any favorite books?",
      subtitle: "Name a few books you loved — we'll use them as a starting point.",
      content: (
        <textarea
          value={prefs.favorite_books}
          onChange={e => setPrefs(p => ({ ...p, favorite_books: e.target.value }))}
          placeholder="e.g. The Name of the Wind, Thinking Fast and Slow, The Road..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
        />
      )
    }
  ];

  async function finish() {
    if (!user) return;
    setLoading(true);
    try {
      const favoriteBooksList = prefs.favorite_books
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);

      await base44.entities.UserPreferences.create({
        user_email: user.email,
        favorite_genres: prefs.favorite_genres,
        disliked_genres: prefs.disliked_genres,
        moods: prefs.moods,
        pacing: prefs.pacing,
        difficulty: prefs.difficulty,
        favorite_books: favoriteBooksList,
        onboarding_completed: true,
        theme_mode: 'bold',
        color_scheme: 'dark',
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <img src="https://media.base44.com/images/public/user_6a12376d0f4ca5762da03b88/1678f5c8f_Lexio.png" alt="Lexio" className="h-8 w-auto" />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {step + 1} of {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: 'var(--border-color)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'var(--accent-primary)' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{current.title}</h2>
          <p className="mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>{current.subtitle}</p>
          {current.content}
        </div>
      </div>

      {/* Footer nav */}
      <div className="p-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'var(--bg-card)',
            color: step === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
            border: '2px solid var(--border-color)',
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all"
            style={{ background: 'var(--accent-primary)', color: '#000' }}
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all"
            style={{ background: 'var(--accent-primary)', color: '#000', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Setting up...' : 'Start discovering'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}