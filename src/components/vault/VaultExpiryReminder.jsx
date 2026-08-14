import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, CalendarCheck, BellOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

export default function VaultExpiryReminder({ user }) {
  const [allCards, setAllCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showDismissOptions, setShowDismissOptions] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadCards();
  }, [user]);

  async function loadCards() {
    try {
      const [entries, states] = await Promise.all([
        base44.entities.VaultEntry.filter({ user_email: user.email }),
        base44.entities.VaultReminderState.filter({ user_email: user.email }),
      ]);
      const stateMap = {};
      states.forEach(s => { stateMap[s.card_id] = s; });
      const now = Date.now();
      const expiring = entries
        .filter(e => {
          if (!e.expiration_date) return false;
          const exp = new Date(e.expiration_date).getTime();
          return exp <= now + TWO_MONTHS_MS;
        })
        .filter(e => {
          const state = stateMap[e.id];
          const snoozeUntil = state?.snooze_until ? new Date(state.snooze_until).getTime() : 0;
          const forgetUntil = state?.forget_until ? new Date(state.forget_until).getTime() : 0;
          return now >= snoozeUntil && now >= forgetUntil;
        })
        .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
      setAllCards(expiring);
      setActiveCard(expiring[0] || null);
    } catch (e) {}
  }

  async function setCardState(cardId, updates) {
    const existing = await base44.entities.VaultReminderState.filter({ user_email: user.email, card_id: cardId });
    if (existing[0]) {
      await base44.entities.VaultReminderState.update(existing[0].id, updates);
    } else {
      await base44.entities.VaultReminderState.create({ user_email: user.email, card_id: cardId, ...updates });
    }
  }

  async function snooze(cardId, days) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await setCardState(cardId, { snooze_until: until });
    advance(cardId);
  }

  async function forget(cardId) {
    const until = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await setCardState(cardId, { forget_until: until });
    advance(cardId);
  }

  function advance(cardId) {
    const remaining = allCards.filter(c => c.id !== cardId);
    setAllCards(remaining);
    setActiveCard(remaining[0] || null);
    setShowDismissOptions(false);
    setShowRenew(false);
    setNewExpiry('');
  }

  async function renew(cardId) {
    if (!newExpiry) return;
    setRenewing(true);
    try {
      await base44.entities.VaultEntry.update(cardId, { expiration_date: newExpiry });
      const existing = await base44.entities.VaultReminderState.filter({ user_email: user.email, card_id: cardId });
      if (existing[0]) {
        await base44.entities.VaultReminderState.delete(existing[0].id);
      }
      advance(cardId);
    } catch (e) {}
    setRenewing(false);
  }

  if (!activeCard) return null;

  const expDate = new Date(activeCard.expiration_date);
  const daysUntil = Math.ceil((expDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const isExpired = daysUntil < 0;

  return (
    <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {isExpired ? 'Library card expired' : 'Library card expiring soon'}
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Your <strong>{activeCard.card_name}</strong> card {isExpired ? 'expired' : 'expires'} on {expDate.toLocaleDateString()}.
            {!isExpired && ` That's in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`}
          </p>

          {showRenew ? (
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--text-muted)' }}>New expiration date</label>
              <div className="flex gap-2">
                <input type="date" className="lx-input text-sm flex-1" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                <button onClick={() => renew(activeCard.id)} disabled={!newExpiry || renewing} className="lx-btn-primary text-sm whitespace-nowrap">
                  {renewing ? 'Saving...' : (<><CalendarCheck size={14} /> Save</>)}
                </button>
              </div>
              <button onClick={() => setShowRenew(false)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </div>
          ) : showDismissOptions ? (
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { days: 7, label: '1 week' },
                { days: 14, label: '2 weeks' },
                { days: 21, label: '3 weeks' },
                { days: 30, label: '1 month' },
              ].map(({ days, label }) => (
                <button key={days} onClick={() => snooze(activeCard.id, days)}
                  className="text-xs px-3 py-1.5 rounded transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                  {label}
                </button>
              ))}
              <button onClick={() => setShowDismissOptions(false)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowRenew(true)}
                className="text-xs px-3 py-1.5 rounded font-semibold transition-all"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                <CalendarCheck size={12} className="inline mr-1" /> I renewed it
              </button>
              <button onClick={() => setShowDismissOptions(true)}
                className="text-xs px-3 py-1.5 rounded transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}>
                Remind me later
              </button>
              <button onClick={() => forget(activeCard.id)}
                className="text-xs px-3 py-1.5 rounded transition-all"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>
                <BellOff size={12} className="inline mr-1" /> Forget for 3 months
              </button>
            </div>
          )}
        </div>
        <button onClick={() => snooze(activeCard.id, 7)} className="flex-shrink-0 transition-opacity hover:opacity-60" title="Snooze 1 week">
          <X size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
}