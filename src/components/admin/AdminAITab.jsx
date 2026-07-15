import React, { useState } from 'react';
import { Sparkles, Send, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FEATURE_MAP = {
  banned_from_forums: 'Forums',
  banned_from_clubs: 'Clubs',
  banned_from_comments: 'Comments',
  banned_from_discussions: 'Discussions',
  banned_from_chat: 'AI Chat',
};

export default function AdminAITab({ user }) {
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  async function executeCommand() {
    if (!input.trim() || processing) return;
    setProcessing(true);
    setError('');
    try {
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an admin assistant for Lexio, a reading app. Parse the admin's natural language instruction about restricting or managing a user.

Available feature restriction keys (use these EXACT strings):
- banned_from_forums: ban from forums
- banned_from_clubs: ban from clubs / reading clubs
- banned_from_comments: ban from comments
- banned_from_discussions: ban from discussions
- banned_from_chat: ban from AI chat

Actions:
- ban_feature: ban user from specific features (provide features array)
- full_ban: completely ban the user
- unban_feature: remove specific feature bans (provide features array)
- unban_all: remove all bans and restrictions
- warn: issue a warning (no ban)

Admin's instruction: "${input}"

Return the parsed result with the user's email (lowercase), the action, which features to ban/unban (if applicable), and a brief reason.`,
        response_json_schema: {
          type: 'object',
          properties: {
            user_email: { type: 'string', description: 'The email of the user to act on (lowercase)' },
            action: { type: 'string', enum: ['ban_feature', 'full_ban', 'unban_feature', 'unban_all', 'warn'] },
            features: { type: 'array', items: { type: 'string', enum: ['banned_from_forums', 'banned_from_clubs', 'banned_from_comments', 'banned_from_discussions', 'banned_from_chat'] } },
            reason: { type: 'string' },
          },
          required: ['user_email', 'action'],
        },
      });

      const { user_email, action, features, reason } = llmRes;

      const existing = await base44.entities.UserSafeness.filter({ user_email });
      let record;
      if (existing[0]) {
        record = existing[0];
      } else {
        record = await base44.entities.UserSafeness.create({
          user_email,
          is_banned: false,
          ban_reason: '',
          ban_expires: '',
          notes: '',
          banned_from_forums: false,
          banned_from_clubs: false,
          banned_from_comments: false,
          banned_from_discussions: false,
          banned_from_chat: false,
          warning_count: 0,
        });
      }

      let update = {};
      let summary = '';

      if (action === 'full_ban') {
        update.is_banned = true;
        update.ban_reason = reason || 'Banned via Admin AI';
        summary = `✅ Full ban applied to ${user_email}`;
      } else if (action === 'ban_feature') {
        (features || []).forEach((f) => { update[f] = true; });
        summary = `✅ Restricted ${user_email} from: ${(features || []).map((f) => FEATURE_MAP[f] || f).join(', ') || 'no features specified'}`;
      } else if (action === 'unban_feature') {
        (features || []).forEach((f) => { update[f] = false; });
        summary = `✅ Unrestricted ${user_email} from: ${(features || []).map((f) => FEATURE_MAP[f] || f).join(', ') || 'no features specified'}`;
      } else if (action === 'unban_all') {
        update.is_banned = false;
        update.ban_reason = '';
        update.ban_expires = '';
        update.banned_from_forums = false;
        update.banned_from_clubs = false;
        update.banned_from_comments = false;
        update.banned_from_discussions = false;
        update.banned_from_chat = false;
        summary = `✅ Removed all restrictions from ${user_email}`;
      } else if (action === 'warn') {
        update.warning_count = (record.warning_count || 0) + 1;
        update.warning_reasons = [...(record.warning_reasons || []), reason || 'Warned via Admin AI'];
        update.last_warning_date = new Date().toISOString();
        summary = `✅ Warning issued to ${user_email}`;
      }

      await base44.entities.UserSafeness.update(record.id, update);

      setHistory((prev) => [{ input: input.trim(), summary, timestamp: new Date().toLocaleTimeString() }, ...prev]);
      setInput('');
    } catch (e) {
      setError(e.message || 'Failed to process command');
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: 'var(--lx-accent)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Admin AI</p>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Tell the AI what you want to do in plain English. It will parse your command and apply the restriction automatically.
        </p>

        <div className="flex gap-2">
          <input
            className="lx-input text-sm flex-1"
            placeholder="e.g. Ban john@example.com from forums and chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
            disabled={processing}
          />
          <button onClick={executeCommand} disabled={processing || !input.trim()} className="lx-btn-primary text-sm">
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            'Ban user@example.com from forums',
            'Fully ban user@example.com',
            'Remove all restrictions from user@example.com',
            'Warn user@example.com about spam',
          ].map((example) => (
            <button key={example} onClick={() => setInput(example)} className="text-xs px-2 py-1 rounded transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#f87171' }}>
            <AlertTriangle size={12} /> {error}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Recent Actions</p>
          {history.map((h, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.timestamp}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>&ldquo;{h.input}&rdquo;</p>
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--lx-accent)' }}>{h.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}