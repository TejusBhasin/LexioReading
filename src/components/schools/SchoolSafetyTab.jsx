import React, { useState, useEffect } from 'react';
import { Flag, ShieldAlert, Send, Clock, Check, AlertTriangle, MessageSquareReply, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BanStudentModal from '@/components/schools/BanStudentModal';

const CONTENT_TYPE_LABELS = {
  forum_post: 'Forum Post',
  forum_comment: 'Comment',
  review: 'Review',
  club_post: 'Club Post',
  discussion: 'Discussion',
  chat_message: 'Chat Message',
  other: 'User Report',
};

export default function SchoolSafetyTab({ school, user }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionText, setSuggestionText] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [banTarget, setBanTarget] = useState(null);

  useEffect(() => { if (school?.id) load(); }, [school]);

  async function load() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('schoolSafetyIncidents', {
        action: 'list',
        school_id: school.id,
      });
      setIncidents(res.data?.incidents || []);
    } catch (e) {}
    setLoading(false);
  }

  async function submitSuggestion(reportId) {
    const text = suggestionText[reportId];
    if (!text?.trim()) return;
    setSubmitting(reportId);
    try {
      await base44.functions.invoke('schoolSafetyIncidents', {
        action: 'suggest',
        school_id: school.id,
        report_id: reportId,
        suggestion: text.trim(),
      });
      setIncidents(prev => prev.map(i => i.id === reportId ? {
        ...i,
        school_suggested_action: text.trim(),
        school_suggested_by: user.email,
        school_suggested_at: new Date().toISOString(),
      } : i));
      setSuggestionText(s => ({ ...s, [reportId]: '' }));
    } catch (e) {}
    setSubmitting(null);
  }

  const pending = incidents.filter(i => i.status === 'pending');
  const resolved = incidents.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--lx-border)' }}>
        <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Safety incidents</strong> reported about your students appear here. You can suggest a course of action — Lexio admins will review your suggestion but retain full discretion over the final decision.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : incidents.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <Flag size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No safety incidents reported for your students.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>PENDING REVIEW ({pending.length})</p>
              <div className="space-y-3">
                {pending.map(inc => <IncidentCard key={inc.id} incident={inc} suggestionText={suggestionText} setSuggestionText={setSuggestionText} submitting={submitting} onSubmit={submitSuggestion} onBan={(email, name, incidentId) => setBanTarget({ email, name, incidentId })} />)}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>RESOLVED ({resolved.length})</p>
              <div className="space-y-3">
                {resolved.map(inc => <IncidentCard key={inc.id} incident={inc} suggestionText={suggestionText} setSuggestionText={setSuggestionText} submitting={submitting} onSubmit={submitSuggestion} onBan={(email, name, incidentId) => setBanTarget({ email, name, incidentId })} />)}
              </div>
            </div>
          )}
        </>
      )}
      {banTarget && (
        <BanStudentModal
          studentEmail={banTarget.email}
          studentName={banTarget.name}
          incidentId={banTarget.incidentId}
          onClose={() => setBanTarget(null)}
          onBanned={() => {
            setBanTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function IncidentCard({ incident, suggestionText, setSuggestionText, submitting, onSubmit, onBan }) {
  const hasSuggestion = !!incident.school_suggested_action;

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${incident.status === 'pending' ? 'rgba(249,115,22,0.4)' : 'var(--lx-border)'}`,
      }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
          {CONTENT_TYPE_LABELS[incident.content_type] || incident.content_type}
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: incident.status === 'pending' ? 'rgba(249,115,22,0.15)' : incident.status === 'actioned' ? 'rgba(248,113,113,0.15)' : 'var(--bg-elevated)',
            color: incident.status === 'pending' ? '#f97316' : incident.status === 'actioned' ? '#f87171' : 'var(--text-muted)',
          }}>
          {incident.status}
        </span>
        <span className="text-xs" style={{ color: 'var(--lx-accent)' }}>{incident.reason}</span>
      </div>

      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Student: <span style={{ color: 'var(--text-secondary)' }}>{incident.reported_username}</span>
          {' · '}{new Date(incident.created_date).toLocaleString()}
        </p>
      </div>

      {incident.content_snapshot && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Reported content:</p>
          <p className="line-clamp-4" style={{ color: 'var(--text-secondary)' }}>{incident.content_snapshot}</p>
        </div>
      )}

      {incident.details && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-bold">Reporter note:</span> {incident.details}
        </p>
      )}

      {/* Resolution status */}
      {incident.status !== 'pending' && (
        <div className="p-2 rounded-lg flex items-center gap-2 text-xs"
          style={{
            background: incident.ai_verdict === 'upheld' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${incident.ai_verdict === 'upheld' ? 'rgba(248,113,113,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}>
          {incident.ai_verdict === 'upheld' ? <AlertTriangle size={12} style={{ color: '#f87171' }} /> : <Check size={12} style={{ color: '#10b981' }} />}
          <span style={{ color: incident.ai_verdict === 'upheld' ? '#f87171' : '#10b981', fontWeight: 600 }}>
            {incident.ai_verdict === 'upheld' ? 'Violation upheld by Lexio' : 'Dismissed by Lexio'}
          </span>
          {incident.action_taken === 'warned' && <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>Student Warned</span>}
          {incident.action_taken === 'banned' && <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>Student Banned</span>}
        </div>
      )}

      {/* School suggestion */}
      {hasSuggestion ? (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquareReply size={12} style={{ color: '#818cf8' }} />
            <span className="text-xs font-bold" style={{ color: '#818cf8' }}>Your Suggested Action</span>
            {incident.school_suggested_at && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {new Date(incident.school_suggested_at).toLocaleDateString()}</span>}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{incident.school_suggested_action}</p>
        </div>
      ) : incident.status === 'pending' && (
        <div className="space-y-2">
          <textarea
            className="lx-input text-sm resize-none"
            rows={2}
            placeholder="Suggest a course of action for Lexio admins to consider..."
            value={suggestionText[incident.id] || ''}
            onChange={e => setSuggestionText(s => ({ ...s, [incident.id]: e.target.value }))}
          />
          <button
            onClick={() => onSubmit(incident.id)}
            disabled={!suggestionText[incident.id]?.trim() || submitting === incident.id}
            className="lx-btn-primary text-xs"
          >
            {submitting === incident.id ? 'Submitting...' : <><Send size={12} /> Submit Suggestion</>}
          </button>
        </div>
      )}

      {/* Ban button — available on all incidents */}
      {incident.status !== 'actioned' && (
        <button
          onClick={() => onBan(incident.reported_user_email, incident.reported_username, incident.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
        >
          <Ban size={12} /> Ban Student (up to 7 days)
        </button>
      )}
    </div>
  );
}