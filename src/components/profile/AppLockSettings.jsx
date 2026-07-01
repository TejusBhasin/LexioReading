import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PinPad from '@/components/ui/PinPad';

export default function AppLockSettings({ user, userProfile, onUpdate }) {
  const [enabled, setEnabled] = useState(userProfile?.app_lock_enabled || false);
  const [step, setStep] = useState(null);
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveSettings(newEnabled, newPin) {
    setSaving(true);
    try {
      const data = { app_lock_enabled: newEnabled, app_lock_pin: newPin };
      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, data);
      } else {
        await base44.entities.UserProfile.create({ user_email: user.email, ...data });
      }
      setEnabled(newEnabled);
      onUpdate?.();
    } catch (e) {
      setError('Failed to save settings');
    }
    setSaving(false);
  }

  function toggleEnabled() {
    if (enabled) {
      saveSettings(false, '');
      setStep(null);
    } else {
      setStep('set_pin');
    }
  }

  function handlePinComplete(entered) {
    if (step === 'set_pin') {
      setTempPin(entered);
      setStep('confirm_pin');
    } else if (step === 'confirm_pin') {
      if (entered === tempPin) {
        saveSettings(true, entered);
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

  if (step) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-6">
          <Lock size={28} className="mx-auto mb-2" style={{ color: 'var(--lx-accent)' }} />
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {step === 'set_pin' ? 'Set Your PIN' : 'Confirm Your PIN'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {step === 'set_pin' ? 'Choose a 4-digit PIN to lock the app' : 'Enter the same PIN again to confirm'}
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
          <Lock size={18} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>App Lock</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Lock the app with a PIN. When enabled, you'll need to enter your PIN each time you open the app or return to it from the background.
          </p>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable App Lock</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{enabled ? 'Active — app is locked on launch' : 'Off'}</p>
            </div>
            <button onClick={toggleEnabled} disabled={saving}
              className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
              style={{ background: enabled ? 'var(--lx-accent)' : 'var(--border-strong)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: enabled ? '22px' : '2px' }} />
            </button>
          </div>
          {enabled && (
            <button onClick={() => setStep('set_pin')} className="lx-btn-ghost text-sm mt-3">
              Change PIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}