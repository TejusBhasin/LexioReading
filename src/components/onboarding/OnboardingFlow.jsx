import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { GENRE_OPTIONS, MOOD_OPTIONS } from '@/lib/theme';

const STEPS = [
  {
    id: 'favorite_books',
    question: "What are some books you've loved? (Any genre, any time)",
    type: 'text',
    placeholder: 'e.g. Harry Potter, Dune, The Alchemist...',
  },
  {
    id: 'favorite_genres',
    question: 'Which genres excite you most?',
    type: 'multiselect',
    options: GENRE_OPTIONS,
  },
  {
    id: 'moods',
    question: 'What reading mood are you usually in?',
    type: 'multiselect',
    options: MOOD_OPTIONS,
  },
  {
    id: 'pacing',
    question: 'How do you like your books paced?',
    type: 'select',
    options: [
      { value: 'fast', label: 'Fast-paced — hard to put down' },
      { value: 'medium', label: 'Balanced — some action, some depth' },
      { value: 'slow', label: 'Slow burn — rich world-building' },
      { value: 'any', label: 'No preference' },
    ],
  },
  {
    id: 'disliked_content',
    question: "Anything you'd rather avoid?",
    type: 'multiselect',
    options: ['Graphic violence', 'Explicit content', 'Slow pacing', 'Love triangles', 'Open endings', 'Heavy romance', 'Dark themes', 'Political themes'],
    optional: true,
  },
];

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function toggleOption(id, val) {
    setAnswers(prev => {
      const arr = prev[id] || [];
      return {
        ...prev,
        [id]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
      };
    });
  }

  function selectOption(id, val) {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }

  function next() {
    if (currentStep.type === 'text') {
      if (textInput.trim()) {
        setAnswers(prev => ({ ...prev, [currentStep.id]: textInput.split(',').map(s => s.trim()) }));
      }
      setTextInput('');
    }
    if (isLast) {
      save();
    } else {
      setStep(s => s + 1);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const existing = await base44.entities.UserPreferences.filter({ user_email: user.email });
      const data = {
        user_email: user.email,
        favorite_books: answers.favorite_books || [],
        favorite_genres: answers.favorite_genres || [],
        moods: answers.moods || [],
        pacing: answers.pacing || 'any',
        disliked_content: answers.disliked_content || [],
        onboarding_complete: true,
        theme_mode: 'bold',
        color_scheme: 'dark',
      };
      if (existing.length > 0) {
        await base44.entities.UserPreferences.update(existing[0].id, data);
      } else {
        await base44.entities.UserPreferences.create(data);
      }
      onComplete(data);
    } catch (e) {
      onComplete({});
    } finally {
      setLoading(false);
    }
  }

  const canContinue = currentStep.optional ||
    (currentStep.type === 'text' ? textInput.trim().length > 0 || (answers[currentStep.id]?.length > 0) :
     currentStep.type === 'select' ? !!answers[currentStep.id] :
     (answers[currentStep.id]?.length > 0));

  return (
    <div className="min-h-screen lx-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--lx-accent)' : 'var(--lx-border)' }}
            />
          ))}
        </div>

        {/* Logo */}
        <img
          src="https://media.base44.com/images/public/user_6a12376d0f4ca5762da03b88/1678f5c8f_Lexio.png"
          alt="Lexio"
          className="h-8 w-auto mb-8"
          style={{ filter: 'brightness(0) invert(1)' }}
        />

        <h2 className="font-display text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          {currentStep.question}
        </h2>

        {/* Text input */}
        {currentStep.type === 'text' && (
          <input
            className="lx-input mb-6"
            placeholder={currentStep.placeholder}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canContinue && next()}
            autoFocus
          />
        )}

        {/* Multiselect */}
        {currentStep.type === 'multiselect' && (
          <div className="flex flex-wrap gap-2 mb-8">
            {currentStep.options.map(opt => {
              const selected = (answers[currentStep.id] || []).includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleOption(currentStep.id, opt)}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                  style={{
                    background: selected ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                    color: selected ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                  }}
                >
                  {selected && <Check size={11} className="inline mr-1" />}
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Select */}
        {currentStep.type === 'select' && (
          <div className="flex flex-col gap-2 mb-8">
            {currentStep.options.map(opt => {
              const selected = answers[currentStep.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => selectOption(currentStep.id, opt.value)}
                  className="text-left px-4 py-3 rounded transition-all"
                  style={{
                    background: selected ? 'var(--lx-accent)' : 'var(--bg-card)',
                    color: selected ? 'var(--bg-primary)' : 'var(--text-primary)',
                    border: `1px solid ${selected ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    fontWeight: selected ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="lx-btn-ghost"
            >
              Back
            </button>
          ) : <div />}

          <button
            onClick={next}
            disabled={!canContinue && !currentStep.optional || loading}
            className="lx-btn-primary"
            style={{ opacity: (!canContinue && !currentStep.optional) || loading ? 0.5 : 1 }}
          >
            {loading ? 'Setting up...' : isLast ? 'Start Discovering' : 'Continue'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </div>

        {currentStep.optional && (
          <button
            onClick={next}
            className="block mt-4 text-sm w-full text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}