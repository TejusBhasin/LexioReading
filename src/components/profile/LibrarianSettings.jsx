import React, { useState } from 'react';
import { Library, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PinPad from '@/components/ui/PinPad';

export default function LibrarianSettings({ user, userProfile, onUpdate }) {
  const [pin, setPin] = useState(userProfile?.librarian_pin || '');
  const [step, setStep] = useState(null);
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function savePin(newPin) {
    setSaving(true);
    try {
      const data = { librarian_pin: newPin };
      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, data);
      } else {
        await base44.entities.UserProfile.create({ user_email: user.email, ...data });
      }
      setPin(newPin);
      onUpdate?.();
    } catch (e) {
      setError('Failed to save');
    }
    setSaving(false);
  }

  function startLibrarianMode() {
    localStorage.setItem('lexio_librarian_mode', 'true');
    window.location.reload();
  }

  function handlePinComplete(entered) {
    if (step === 'set_pin') {
      setTempPin(entered);
      setStep('confirm_pin');
    } else if (step === 'confirm_pin') {
      if (entered === tempPin) {
        savePin(entered);
        setStep(null);
        setTempPin('');
      } else {
        setError('PINs do not match. Try again.');
        setStep('set_pin');
        setTempPin('');
        setTimeout(() => setError(''), 2000);
      }
    }
  }

  const hasPin = !!pin;

  if (step) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-6">
          <Lock size={28} className="mx-auto mb-2" style={{ color: 'var(--lx-accent)' }} />
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {step === 'set_pin' ? 'Set Exit PIN' : 'Confirm Exit PIN'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {step === 'set_pin' ? 'This PIN will be required to exit Librarian Mode' : 'Enter the same PIN again'}
          </p>
        </div>
        <PinPad onComplete={handlePinComplete} />
        {error && <p className="text-center mt-4 text-sm" style={{ color: '#f87171' }}>{error}</p>}
        <button onClick={() => { setStep(null); setTempPin(''); setError(''); }}
          className="lx-btn-ghost text-sm w-full justify-center mt-4">Cancel</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lx-accent)' }}>
          <Library size={18} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Librarian Mode</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Turn this device into a book recommendation kiosk. Visitors can chat with an AI librarian — it won't access your personal library, reviews, or account data. A PIN is required to exit.
          </p>

          {!hasPin ? (
            <button onClick={() => setStep('set_pin')} className="lx-btn-primary text-sm">
              <Lock size={14} /> Set Up Librarian Mode
            </button>
          ) : (
            <div className="space-y-3">
              <button onClick={startLibrarianMode} className="lx-btn-primary text-sm w-full justify-center">
                <Library size={14} /> Start Librarian Mode
              </button>
              <button onClick={() => setStep('set_pin')} className="lx-btn-ghost text-sm">
                Change Exit PIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}