import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Send, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AuthorTag from '@/components/ui/AuthorTag';
import useVerifiedAuthors from '@/hooks/useVerifiedAuthors';

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function BookClubChains({ club, schedule, user }) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [myUsername, setMyUsername] = useState('');
  const bottomRef = useRef(null);
  const verifiedMap = useVerifiedAuthors();

  useEffect(() => {
    if (schedule?.id) loadChains();
  }, [schedule]);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
      setMyUsername(profiles[0]?.username || '');
    }).catch(() => setMyUsername(''));
  }, [user?.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChain]);

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
      const msgs = await base44.entities.ChainMessage.filter({ chain_id: chain.id }, 'created_date', 100);
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
        username: myUsername || null,
        content: newMessage.trim(),
      });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (e) {}
    setSending(false);
  }

  async function deleteMessage(msg) {
    if (!confirm('Delete this message?')) return;
    try {
      await base44.entities.ChainMessage.delete(msg.id);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (e) {}
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
          <div className="lx-card p-10 text-center">
            <MessageSquare size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No discussion chains yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chains are created from the reading schedule.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chains.map(chain => (
              <button
                key={chain.id}
                onClick={() => selectChain(chain)}
                className="lx-card p-5 text-left transition-all hover:border-[var(--lx-accent)]"
              >
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{chain.title}</h3>
                {chain.description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{chain.description}</p>}
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
    <div className="lx-card flex flex-col" style={{ height: '60vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--lx-border)' }}>
        <button onClick={() => setSelectedChain(null)} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedChain.title}</h3>
          {selectedChain.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{selectedChain.description}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare size={32} className="mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Be the first to share!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_email === user?.email;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                {!isMe && (msg.username || verifiedMap[msg.user_email]) && (
                  <AuthorTag email={msg.user_email} username={msg.username} verifiedMap={verifiedMap} prefix="@" className="text-xs mb-0.5 px-1 hover:underline" style={{ color: 'var(--text-muted)' }} />
                )}
                <div className="flex items-end gap-1.5 max-w-[80%]">
                  {isMe && (
                    <button onClick={() => deleteMessage(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }} title="Delete">
                      <Trash2 size={11} />
                    </button>
                  )}
                  <div
                    className="px-3.5 py-2 rounded-2xl text-sm"
                    style={{
                      background: isMe ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                      borderBottomRightRadius: isMe ? '4px' : undefined,
                      borderBottomLeftRadius: !isMe ? '4px' : undefined,
                    }}
                  >
                    {msg.content}
                    {msg.has_spoilers && (
                      <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>
                        ⚠️ Spoilers
                      </span>
                    )}
                    <span className="text-[9px] block mt-0.5" style={{ opacity: 0.6 }}>
                      {formatTime(msg.created_date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t" style={{ borderColor: 'var(--lx-border)' }}>
        <input
          className="lx-input flex-1 text-sm"
          placeholder="Share your thoughts..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="lx-btn-primary px-3"
        >
          {sending ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-primary)', borderTopColor: 'transparent' }} /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}