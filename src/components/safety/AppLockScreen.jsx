import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import PinPad from '@/components/ui/PinPad';

export default function AppLockScreen({ pin, onUnlock }) {
  const [error, setError] = useState(false);

  function handleComplete(entered) {
    if (entered === pin) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--lx-accent)' }}>
          <Lock size={26} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lexio Locked</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your PIN to unlock</p>
      </div>
      <PinPad onComplete={handleComplete} />
      {error && <p className="mt-4 text-sm font-medium" style={{ color: '#f87171' }}>Wrong PIN, try again</p>}
    </div>
  );
}