import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Plus, Trash2, Eye, EyeOff, ShieldCheck, X, CreditCard, KeyRound, Mail, Image, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const PIN_KEY = 'lexio_vault_pin';
const PIN_EXPIRY_KEY = 'lexio_vault_pin_expiry';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export default function VaultPage() {
  const { user, isAuthenticated } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showNumbers, setShowNumbers] = useState({});
  const [form, setForm] = useState({ card_name: '', card_number: '', expiration_date: '', notes: '', image_url_1: '', image_url_2: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState({ img1: false, img2: false });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_KEY);
    setHasPin(!!stored);
    const expiry = localStorage.getItem(PIN_EXPIRY_KEY);
    if (expiry && Date.now() < parseInt(expiry)) {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked && user?.email) loadEntries();
    if (unlocked) {
      localStorage.setItem(PIN_EXPIRY_KEY, (Date.now() + LOCK_TIMEOUT_MS).toString());
    }
  }, [unlocked, user]);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await base44.entities.VaultEntry.filter({ user_email: user.email });
      setEntries(data);
    } catch (e) {}
    setLoading(false);
  }

  function verifyPin() {
    const stored = localStorage.getItem(PIN_KEY);
    if (stored === pinInput) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Try again.');
      setPinInput('');
    }
  }

  function saveNewPin() {
    if (setupPin.length < 4) { setPinError('PIN must be at least 4 characters.'); return; }
    if (setupPin !== setupConfirm) { setPinError('PINs do not match.'); return; }
    localStorage.setItem(PIN_KEY, setupPin);
    setHasPin(true);
    setSetupMode(false);
    setSetupPin(''); setSetupConfirm('');
    setPinError('');
    setUnlocked(true);
  }

  function lock() {
    setUnlocked(false);
    setPinInput('');
    localStorage.removeItem(PIN_EXPIRY_KEY);
  }

  async function sendRecovery() {
    if (!recoveryEmail.trim()) return;
    const stored = localStorage.getItem(PIN_KEY);
    if (!stored) return;
    try {
      await base44.integrations.Core.SendEmail({
        to: recoveryEmail,
        subject: 'Lexio Vault PIN Recovery',
        body: `Your Lexio Vault PIN is: ${stored}\n\nIf you did not request this, please update your PIN immediately.`,
      });
      setRecoverySent(true);
    } catch (e) {}
  }

  async function handleImageUpload(field, file) {
    if (!file) return;
    const key = field === 'image_url_1' ? 'img1' : 'img2';
    setUploadingImg(prev => ({ ...prev, [key]: true }));
    const res = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: res.file_url }));
    setUploadingImg(prev => ({ ...prev, [key]: false }));
  }

  async function addEntry() {
    if (!form.card_name.trim() || !user) return;
    setSaving(true);
    try {
      const entry = await base44.entities.VaultEntry.create({ ...form, user_email: user.email });
      setEntries(prev => [...prev, entry]);
      setShowAdd(false);
      setForm({ card_name: '', card_number: '', expiration_date: '', notes: '', image_url_1: '', image_url_2: '' });
    } catch (e) {}
    setSaving(false);
  }

  async function deleteEntry(id) {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await base44.entities.VaultEntry.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {}
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Vault</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to access your secure vault.</p>
        <a href="/login" className="lx-btn-primary">Sign In</a>
      </div>
    );
  }

  if (!hasPin || setupMode) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="lx-card p-8 text-center">
          <ShieldCheck size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Set Up Your Vault PIN</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create a PIN to secure your library cards and sensitive info.</p>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Create PIN (min 4 chars)</label>
              <input type="password" className="lx-input" placeholder="Enter PIN" value={setupPin} onChange={e => setSetupPin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Confirm PIN</label>
              <input type="password" className="lx-input" placeholder="Confirm PIN" value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNewPin()} />
            </div>
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            <button onClick={saveNewPin} className="lx-btn-primary w-full justify-center">Create PIN</button>
          </div>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="lx-card p-8 text-center">
          <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--lx-accent)' }} />
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Vault Locked</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter your PIN to access your vault.</p>
          <div className="space-y-3">
            <input
              type="password"
              className="lx-input text-center text-xl tracking-widest"
              placeholder="••••"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifyPin()}
              autoFocus
            />
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            <button onClick={verifyPin} className="lx-btn-primary w-full justify-center">
              <Unlock size={14} /> Unlock
            </button>
            <button onClick={() => setShowRecovery(r => !r)} className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Forgot PIN?
            </button>
            {showRecovery && (
              <div className="mt-3 text-left space-y-2">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter your email to receive your PIN:</p>
                <input type="email" className="lx-input text-sm" placeholder="your@email.com" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                {recoverySent ? (
                  <p className="text-xs text-green-400">Recovery email sent!</p>
                ) : (
                  <button onClick={sendRecovery} className="lx-btn-ghost text-sm w-full justify-center">
                    <Mail size={13} /> Send Recovery Email
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Unlock size={22} style={{ color: 'var(--lx-accent)' }} /> My Vault
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Library cards secured with PIN</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSetupMode(true)} className="lx-btn-ghost text-xs py-1.5">
            <KeyRound size={13} /> Change PIN
          </button>
          <button onClick={lock} className="lx-btn-ghost text-xs py-1.5">
            <Lock size={13} /> Lock
          </button>
          <button onClick={() => setShowAdd(true)} className="lx-btn-primary text-sm">
            <Plus size={14} /> Add Card
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="lx-card p-5 h-32 animate-pulse" />)}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(entry => (
            <VaultCard
              key={entry.id}
              entry={entry}
              showNumber={showNumbers[entry.id]}
              onToggleShow={() => setShowNumbers(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className="lx-card p-10 text-center">
          <CreditCard size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No cards stored</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Store your library cards securely.</p>
          <button onClick={() => setShowAdd(true)} className="lx-btn-primary text-sm">Add First Card</button>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Card</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Card Name *</label>
                <input className="lx-input" placeholder="e.g. Brooklyn Public Library" value={form.card_name} onChange={e => setForm(f => ({ ...f, card_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Card Number / ID</label>
                <input className="lx-input" placeholder="Library card barcode or ID" value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Expiration Date</label>
                <input type="date" className="lx-input" value={form.expiration_date} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Notes</label>
                <textarea className="lx-input resize-none" rows={2} placeholder="PIN, branch info, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Card Image (Front)</label>
                {form.image_url_1 ? (
                  <div className="relative inline-block">
                    <img src={form.image_url_1} alt="front" className="h-20 rounded object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, image_url_1: '' }))} className="absolute top-0.5 right-0.5 p-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}><X size={11} style={{ color: 'white' }} /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer lx-btn-ghost w-fit text-sm">
                    {uploadingImg.img1 ? <Loader2 size={13} className="animate-spin" /> : <Image size={13} />}
                    {uploadingImg.img1 ? 'Uploading...' : 'Upload Front Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('image_url_1', e.target.files[0])} />
                  </label>
                )}
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Card Image (Back)</label>
                {form.image_url_2 ? (
                  <div className="relative inline-block">
                    <img src={form.image_url_2} alt="back" className="h-20 rounded object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, image_url_2: '' }))} className="absolute top-0.5 right-0.5 p-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}><X size={11} style={{ color: 'white' }} /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer lx-btn-ghost w-fit text-sm">
                    {uploadingImg.img2 ? <Loader2 size={13} className="animate-spin" /> : <Image size={13} />}
                    {uploadingImg.img2 ? 'Uploading...' : 'Upload Back Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('image_url_2', e.target.files[0])} />
                  </label>
                )}
              </div>
              <button onClick={addEntry} disabled={saving || !form.card_name.trim()} className="lx-btn-primary w-full justify-center">
                {saving ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VaultCard({ entry, showNumber, onToggleShow, onDelete }) {
  return (
    <div className="lx-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={18} style={{ color: 'var(--lx-accent)' }} />
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{entry.card_name}</h3>
        </div>
        <button onClick={onDelete} className="opacity-40 hover:opacity-100 transition-opacity">
          <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {entry.card_number && (
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            {showNumber ? entry.card_number : '•'.repeat(Math.min(entry.card_number.length, 12))}
          </span>
          <button onClick={onToggleShow}>
            {showNumber ? <EyeOff size={13} style={{ color: 'var(--text-muted)' }} /> : <Eye size={13} style={{ color: 'var(--text-muted)' }} />}
          </button>
        </div>
      )}

      {entry.expiration_date && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Expires: {entry.expiration_date}</p>
      )}

      {entry.notes && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.notes}</p>
      )}

      {(entry.image_url_1 || entry.image_url_2) && (
        <div className="flex gap-2 mt-3">
          {entry.image_url_1 && <img src={entry.image_url_1} alt="card front" className="h-16 rounded object-cover" />}
          {entry.image_url_2 && <img src={entry.image_url_2} alt="card back" className="h-16 rounded object-cover" />}
        </div>
      )}
    </div>
  );
}