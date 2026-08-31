import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, KeyRound, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const STATUS_LABELS = {
  pending: 'Verification in progress — complete the identity check.',
  in_progress: 'Identity check in progress.',
  awaiting_user: 'Awaiting your action in the identity check.',
  in_review: 'Your verification is under review.',
  declined: 'Verification was declined. Contact support if you believe this is an error.',
  resubmitted: 'Please resubmit your identity check.',
  abandoned: 'Identity check was abandoned. Try again with a new key.',
  expired: 'Identity check expired. Try again with a new key.',
  not_started: '',
  approved: '',
};

export default function IdentityVerification({ user, userProfile, onUpdated }) {
  const [keyInput, setKeyInput] = useState('');
  const [realName, setRealName] = useState('');
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const status = userProfile?.verification_status || 'not_started';
  const verified = !!userProfile?.is_verified;

  async function cancelAndForfeit() {
    setCancelling(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const p = profiles[0];
      if (p) {
        const updated = await base44.entities.UserProfile.update(p.id, {
          verification_status: 'abandoned',
          didit_session_id: '',
        });
        onUpdated(updated);
      }
    } catch (e) {
      setError('Could not cancel verification. Try again.');
    }
    setCancelling(false);
  }

  // Poll for status updates while a verification is pending.
  useEffect(() => {
    if (verified || !['pending', 'in_progress', 'awaiting_user', 'in_review'].includes(status)) return;
    const id = setInterval(async () => {
      try {
        const p = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (p[0]) onUpdated(p[0]);
      } catch (e) {}
    }, 10000);
    return () => clearInterval(id);
  }, [status, verified, user]);

  async function start() {
    setError('');
    if (keyInput.trim().length < 8 || realName.trim().length < 2) {
      setError('Enter your verification key and full real name.');
      return;
    }
    setStarting(true);
    try {
      const res = await base44.functions.invoke('startDiditVerification', {
        key: keyInput.trim(),
        real_name: realName.trim(),
      });
      const data = res?.data || res;
      if (data?.url) {
        // Redirect to Didit's hosted verification flow (source of truth is the webhook).
        window.location.href = data.url;
      } else {
        setError(data?.error || 'Could not start identity verification.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not start identity verification.');
    }
    setStarting(false);
  }

  if (verified) {
    return (
      <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <ShieldCheck size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            Verified Identity <VerifiedBadge size={15} />
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            You're verified as <strong style={{ color: 'var(--text-primary)' }}>{userProfile?.verified_real_name}</strong>. A blue badge shows next to your name across Lexio, and your real name is used instead of a username.
          </p>
        </div>
      </div>
    );
  }

  const showStatus = ['pending', 'in_progress', 'awaiting_user', 'in_review', 'declined', 'resubmitted', 'abandoned', 'expired'].includes(status);

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} style={{ color: 'var(--lx-accent)' }} />
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Identity Verification</h3>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Got a verification key from Lexio? Paste it below, confirm your real name, and complete a quick identity check to earn a blue verified badge. Verified users are shown by their real name instead of a username.
      </p>

      {showStatus && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: status === 'declined' ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)', color: status === 'declined' ? '#f87171' : 'var(--text-secondary)' }}>
            {status === 'declined' ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> : <Loader2 size={14} className="mt-0.5 flex-shrink-0 animate-spin" />}
            <span>{STATUS_LABELS[status]}</span>
          </div>
          {['pending', 'in_progress', 'awaiting_user', 'in_review'].includes(status) && (
            <button onClick={cancelAndForfeit} disabled={cancelling} className="lx-btn-ghost text-xs w-full justify-center" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}>
              {cancelling ? 'Cancelling...' : 'Cancel & Forfeit Key'}
            </button>
          )}
        </div>
      )}

      {['not_started', 'abandoned', 'expired', 'declined', 'resubmitted'].includes(status) && (
        <>
          <div>
            <label className="text-xs mb-1 block flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><KeyRound size={11} /> Verification Key</label>
            <input className="lx-input text-sm font-mono" placeholder="Paste your 30-character key..."
              value={keyInput} onChange={e => setKeyInput(e.target.value)} />
          </div>
          <div>
            <label className="text-xs mb-1 block flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><User size={11} /> Real Name</label>
            <input className="lx-input text-sm" placeholder="Your full legal name"
              value={realName} onChange={e => setRealName(e.target.value)} />
          </div>
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
          <button onClick={start} disabled={starting} className="lx-btn-primary text-sm w-full justify-center">
            {starting ? 'Starting...' : 'Start Identity Check'}
          </button>
        </>
      )}
    </div>
  );
}