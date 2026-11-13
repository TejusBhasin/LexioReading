import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Site-wide red notice shown while sign-in is broken. Deliberately has no
// close control: it stays until this file is removed from App.jsx.
export default function LoginOutageBanner() {
  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] px-3 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2"
      style={{ background: '#dc2626', color: '#ffffff', borderBottom: '1px solid #991b1b' }}
    >
      <AlertTriangle size={14} aria-hidden="true" />
      <span>Login is not working right now — we are working to fix the issue.</span>
    </div>
  );
}