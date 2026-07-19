import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const GATE_EXPIRY_KEY = 'lexio_admin_gate_expiry';
const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function validateAdminPassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/^[a-zA-Z0-9]+$/.test(password)) return 'Password must be alphanumeric only (letters and numbers, no special characters).';
  const upperCount = (password.match(/[A-Z]/g) || []).length;
  if (upperCount < 2) return 'Password must have at least 2 capital letters.';
  return null;
}

export default function AdminAccessGate({ children, label = 'Admin Panel' }) {
  const [checking, setChecking] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pinRecord, setPinRecord] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const expiry = localStorage.getItem(GATE_EXPIRY_KEY);
    if (expiry && Date.now() < parseInt(expiry)) {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u?.email && mounted) {
          setUserEmail(u.email);
          try {
            const records = await base44.entities.AdminAccessPin.filter({ user_email: u.email });
            if (records[0] && records[0].has_pin) {
              setPinRecord(records[0]);
              setHasPin(true);
            } else {
              setHasPin(false);
            }
          } catch (e) {}
        }
        if (mounted) setChecking(false);
      } catch (e) {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function handleUnlock() {
    if (pinRecord && pinRecord.pin === pinInput) {
      setUnlocked(true);
      setError('');
      localStorage.setItem(GATE_EXPIRY_KEY, (Date.now() + LOCK_TIMEOUT_MS).toString());
    } else {
      setError('Incorrect password. Try again.');
      setPinInput('');
    }
  }

  async function handleSetup() {
    const validationError = validateAdminPassword(setupPin);
    if (validationError) { setError(validationError); return; }
    if (setupPin !== setupConfirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      if (pinRecord) {
        const updated = await base44.entities.AdminAccessPin.update(pinRecord.id, { pin: setupPin, has_pin: true });
        setPinRecord(updated);
      } else {
        const created = await base44.entities.AdminAccessPin.create({ user_email: userEmail, pin: setupPin, has_pin: true });
        setPinRecord(created);
      }
      setHasPin(true);
      setSetupPin('');
      setSetupConfirm('');
      setError('');
      setUnlocked(true);
      localStorage.setItem(GATE_EXPIRY_KEY, (Date.now() + LOCK_TIMEOUT_MS).toString());
    } catch (e) {
      setError('Failed to save password. Try again.');
    }
    setSaving(false);
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--lx-accent)' }} />
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  // Setup mode (no password set yet)
  if (!hasPin) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="lx-card p-8 text-center">
          <Shield size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Set Admin Access Password
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Create a password to secure access to the {label}. Required for all admin actions.
          </p>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type="password" className="lx-input" placeholder="Min 8 chars, 2+ capitals" value={setupPin} onChange={e => setSetupPin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
              <input type="password" className="lx-input" placeholder="Confirm password" value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetup()} />
            </div>
            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
            <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              <p className="font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Requirements:</p>
              <ul className="space-y-0.5 pl-3 list-disc">
                <li>At least 8 characters</li>
                <li>Alphanumeric only (letters and numbers)</li>
                <li>At least 2 capital letters</li>
              </ul>
            </div>
            <button onClick={handleSetup} disabled={saving} className="lx-btn-primary w-full justify-center">
              {saving ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unlock mode
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="lx-card p-8 text-center">
        <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{label} Locked</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter your admin access password to continue.</p>
        <div className="space-y-3">
          <input
            type="password"
            className="lx-input text-center"
            placeholder="Enter password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
          <button onClick={handleUnlock} className="lx-btn-primary w-full justify-center">
            <KeyRound size={14} /> Unlock
          </button>
        </div>
      </div>
    </div>
  );
}