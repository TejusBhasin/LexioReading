import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AgeVerificationModal({ user, onVerified, onClose }) {
  const [confirming, setConfirming] = useState(false);

  async function confirm() {
    setConfirming(true);
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) {
        await base44.entities.UserProfile.update(p[0].id, { age_verified: true });
      } else {
        await base44.entities.UserProfile.create({ user_email: user.email, age_verified: true });
      }
      onVerified();
    } catch (e) {}
    setConfirming(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        <ShieldAlert size={36} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Age Verification</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This content may be intended for adults (18+). Please confirm your age to continue.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="lx-btn-ghost flex-1 justify-center">Go Back</button>
          <button onClick={confirm} disabled={confirming} className="lx-btn-primary flex-1 justify-center">
            {confirming ? 'Confirming...' : 'I am 18+'}
          </button>
        </div>
      </div>
    </div>
  );
}