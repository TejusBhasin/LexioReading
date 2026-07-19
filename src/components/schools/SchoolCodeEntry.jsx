import React, { useState } from 'react';
import { GraduationCap, KeyRound, Check, Loader2, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function SchoolCodeEntry({ user, onCreated }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [codeId, setCodeId] = useState(null);
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [creating, setCreating] = useState(false);

  async function validateCode() {
    if (code.length !== 300) { setError('Code must be exactly 300 characters.'); return; }
    setValidating(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageSchoolCreationCodes', { action: 'validate', code });
      if (res.data?.valid) {
        setCodeValid(true);
        setCodeId(res.data.code_id);
      } else {
        setError(res.data?.error || 'Invalid or already used code.');
      }
    } catch (e) {
      setError('Failed to validate code.');
    }
    setValidating(false);
  }

  async function createSchool() {
    if (!schoolName.trim() || !agreed) return;
    setCreating(true);
    setError('');
    try {
      const joinCode = Math.random().toString(36).slice(2, 7).toUpperCase();
      const s = await base44.entities.School.create({
        name: schoolName.trim(),
        description: '',
        creator_email: user.email,
        join_code: joinCode,
        theme_primary: '#f5a623',
        theme_accent: '#e8854a',
        theme_secondary: '#1a1a1a',
        theme_locked: true,
        restrictions: [],
        data_access_fields: ['reading_logs', 'library', 'reviews'],
        member_count: 1,
        is_active: true,
      });
      await base44.entities.SchoolMember.create({
        school_id: s.id,
        school_name: s.name,
        user_email: user.email,
        username: user.full_name || user.email,
        role: 'admin',
        joined_date: new Date().toISOString(),
        kicked: false,
      });
      await base44.functions.invoke('manageSchoolCreationCodes', { action: 'consume', code_id: codeId, school_id: s.id, school_name: s.name });
      // Log the action
      try {
        await base44.entities.SchoolActionLog.create({
          school_id: s.id,
          school_name: s.name,
          actor_email: user.email,
          actor_name: user.full_name || user.email,
          actor_role: user.role === 'admin' ? 'lexio_admin' : 'school_admin',
          action_type: 'school_created',
          action_description: `School "${s.name}" created`,
        });
      } catch (e) {}
      setCode('');
      setSchoolName('');
      setAgreed(false);
      setCodeValid(false);
      setCodeId(null);
      setExpanded(false);
      navigate('/school-admin');
    } catch (e) {
      setError('Failed to create school.');
    }
    setCreating(false);
  }

  function reset() {
    setCode('');
    setCodeValid(false);
    setCodeId(null);
    setError('');
    setSchoolName('');
    setAgreed(false);
  }

  return (
    <div className="lx-card p-4">
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={16} style={{ color: 'var(--lx-accent)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Create a School</p>
        </div>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {!codeValid ? (
            <>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                School creation requires a 300-character authorization code from Lexio. Enter your code below.
              </p>
              <textarea
                className="lx-input text-xs font-mono resize-none"
                rows={4}
                placeholder="Paste your 300-character code here..."
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={300}
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{code.length}/300 characters</p>
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
              <button onClick={validateCode} disabled={validating || code.length !== 300} className="lx-btn-primary w-full justify-center text-sm">
                {validating ? <><Loader2 size={14} className="animate-spin" /> Validating...</> : 'Validate Code'}
              </button>
              <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>
                Want to make a school? Email{' '}
                <a href="mailto:SchoolCreation@LexioReading.App" style={{ color: 'var(--lx-accent)', fontWeight: 600 }}>SchoolCreation@LexioReading.App</a>
              </p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                <p className="text-xs" style={{ color: '#10b981' }}>Code verified! Complete your school setup below.</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>School Name *</label>
                <input className="lx-input text-sm" placeholder="e.g. Lincoln High Book Club" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
              </div>
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--lx-accent)' }}>
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>School Creation Agreement</p>
                  <ul style={{ paddingLeft: '1rem', listStyle: 'disc' }}>
                    <li>The group has <strong>10 or more members</strong> who will join.</li>
                    <li>You are authorized to create this school.</li>
                    <li>School membership is permanent for all members.</li>
                    <li>You agree to Lexio's <a href="/terms-privacy" style={{ color: 'var(--lx-accent)' }}>Terms &amp; Conditions</a> and Privacy Policy.</li>
                  </ul>
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-secondary)' }}>
                <button onClick={() => setAgreed(!agreed)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{ background: agreed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${agreed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                  {agreed && <Check size={11} style={{ color: 'var(--bg-primary)' }} />}
                </button>
                I confirm this group has 10+ members and I agree to the terms above.
              </label>
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={reset} className="lx-btn-ghost flex-1 justify-center text-sm">Cancel</button>
                <button onClick={createSchool} disabled={creating || !schoolName.trim() || !agreed} className="lx-btn-primary flex-1 justify-center text-sm">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create School'}
                </button>
              </div>
              <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>
                Want to make a school? Email{' '}
                <a href="mailto:SchoolCreation@LexioReading.App" style={{ color: 'var(--lx-accent)', fontWeight: 600 }}>SchoolCreation@LexioReading.App</a>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}