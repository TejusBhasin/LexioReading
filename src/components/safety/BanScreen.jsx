import React from 'react';
import { ShieldOff } from 'lucide-react';

export default function BanScreen({ reason }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center flex-col gap-5 px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}>
      <ShieldOff size={48} style={{ color: 'var(--lx-accent)' }} />
      <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Account Restricted
      </h1>
      <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {reason || 'Your account has been restricted by a moderator.'}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        If you believe this is a mistake, contact{' '}
        <a href="mailto:Tejusbhasin17@gmail.com" style={{ color: 'var(--lx-accent)' }}>
          Tejusbhasin17@gmail.com
        </a>
      </p>
    </div>
  );
}