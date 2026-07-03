import React from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

export default function ChatSessionList({ sessions, activeSession, onSelect, onDelete, onNew, loading }) {
  return (
    <>
      <div className="p-4 border-b" style={{ borderColor: 'var(--lx-border)' }}>
        <button onClick={onNew} className="lx-btn-primary w-full justify-center text-sm">
          <Plus size={14} /> New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && !loading && (
          <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No chats yet</p>
        )}
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="group w-full text-left px-4 py-3 border-b transition-all"
            style={{
              borderColor: 'var(--lx-border)',
              background: activeSession === s.id ? 'var(--bg-elevated)' : 'transparent',
              borderLeft: activeSession === s.id ? `2px solid var(--lx-accent)` : '2px solid transparent',
            }}
          >
            <div className="flex items-center gap-2 pr-1">
              <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                {s.title || 'Chat'}
              </span>
              <button
                onClick={(e) => onDelete(s.id, e)}
                className="flex-shrink-0 p-1 rounded transition-opacity opacity-40 hover:opacity-100"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
            {s.lastMessage && (
              <p className="text-xs mt-0.5 truncate pl-5" style={{ color: 'var(--text-muted)' }}>
                {s.lastMessage.slice(0, 50)}
              </p>
            )}
          </button>
        ))}
      </div>
    </>
  );
}