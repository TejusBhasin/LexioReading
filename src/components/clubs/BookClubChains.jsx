import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BookClubChains({ club, schedule, user }) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (schedule?.id) {
      loadChains();
    }
  }, [schedule]);

  async function loadChains() {
    setLoading(true);
    try {
      const c = await base44.entities.BookClubChain.filter({ schedule_id: schedule.id });
      setChains(c);
    } catch (e) {}
    setLoading(false);
  }

  async function selectChain(chain) {
    setSelectedChain(chain);
    try {
      const msgs = await base44.entities.ChainMessage.filter({ chain_id: chain.id }, '-created_date', 50);
      setMessages(msgs);
    } catch (e) {}
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user || !selectedChain) return;
    setSending(true);
    try {
      const msg = await base44.entities.ChainMessage.create({
        club_id: club.id,
        chain_id: selectedChain.id,
        user_email: user.email,
        username: user.full_name || user.email,
        content: newMessage,
      });
      setMessages(prev => [msg, ...prev]);
      setNewMessage('');
    } catch (e) {}
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!selectedChain) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare size={18} style={{ color: 'var(--lx-accent)' }} />
          Discussion Chains
        </h2>
        {chains.length === 0 ? (
          <div className="lx-card p-8 text-center">
            <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No discussion chains yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chains.map(chain => (
              <button
                key={chain.id}
                onClick={() => selectChain(chain)}
                className="lx-card p-5 text-left hover:border-[var(--lx-accent)] transition-colors"
              >
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{chain.title}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{chain.description}</p>
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <MessageSquare size={10} /> {chain.message_count || 0} messages
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'var(--lx-border)' }}>
        <div>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedChain.title}</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedChain.description}</p>
        </div>
        <button onClick={() => setSelectedChain(null)} className="lx-btn-ghost text-sm">
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)' }}>No messages yet. Be the first to share!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="lx-card p-3">
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{msg.username}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
              {msg.has_spoilers && (
                <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                  ⚠️ Has spoilers
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--lx-border)' }}>
        <input
          className="lx-input flex-1"
          placeholder="Share your thoughts..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="lx-btn-primary text-sm py-1.5 px-3"
        >
          Send
        </button>
      </div>
    </div>
  );
}