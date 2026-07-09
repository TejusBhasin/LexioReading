import React, { useState } from 'react';
import { Bell, Share2, UserPlus, UserMinus, Key, Copy, Check, Settings, Pin } from 'lucide-react';

export default function ClubHero({ club, user, isAdmin, isMember, onJoin, onLeave, onToggleNotif, notifEnabled, onOpenSettings }) {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const banner = club.banner_image || club.cover_image;
  const icon = club.cover_image;
  const typeEmoji = club.club_type === 'administrative' ? '👥' : club.club_type === 'collaborative' ? '📚' : club.club_type === 'logging' ? '📊' : '💬';

  function copyText(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative mb-4">
      <div className="h-28 md:h-44 rounded-none md:rounded-xl overflow-hidden relative" style={{ background: 'var(--bg-elevated)' }}>
        {banner ? (
          <img src={banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--lx-accent), var(--bg-secondary))' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 50%)' }} />
      </div>

      <div className="px-4 -mt-8 md:-mt-10 relative">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '3px solid var(--bg-primary)', color: 'var(--lx-accent)' }}>
            {icon ? <img src={icon} alt="" className="w-full h-full object-cover" /> : (club.name?.[0]?.toUpperCase() || typeEmoji)}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</h1>
              <span className="text-base">{typeEmoji}</span>
              {!club.is_visible && <Key size={12} style={{ color: 'var(--lx-accent)' }} />}
            </div>
            {club.description && <p className="text-xs md:text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>}
          </div>

          <div className="flex items-center gap-1.5 pb-1">
            {user && !isMember && (
              <button onClick={onJoin} className="lx-btn-primary text-xs px-3 py-1.5"><UserPlus size={13} /> Join</button>
            )}
            {user && isMember && !isAdmin && (
              <button onClick={onLeave} className="lx-btn-ghost text-xs px-3 py-1.5"><UserMinus size={13} /> Leave</button>
            )}
            {user && (
              <button onClick={onToggleNotif} className="flex items-center justify-center rounded p-2 transition-colors"
                style={{ color: notifEnabled ? 'var(--lx-accent)' : 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }} title="Notifications">
                <Bell size={14} />
              </button>
            )}
            <button onClick={() => copyText(`${window.location.origin}/club/${club.id}`)}
              className="flex items-center justify-center rounded p-2 transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }} title="Share">
              {copied ? <Check size={14} style={{ color: 'var(--lx-accent)' }} /> : <Share2 size={14} />}
            </button>
            {isAdmin && (
              <>
                <button onClick={() => setShowInvite(!showInvite)}
                  className="flex items-center justify-center rounded p-2 transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }} title="Invite">
                  <UserPlus size={14} />
                </button>
                <button onClick={onOpenSettings}
                  className="flex items-center justify-center rounded p-2 transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }} title="Settings">
                  <Settings size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {club.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {club.genres.map(g => (
              <span key={g} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>{g}</span>
            ))}
          </div>
        )}

        {showInvite && club.join_code && (
          <div className="mb-3 p-3 rounded-lg flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-accent)' }}>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Share this invite code:</p>
              <p className="font-mono font-bold text-lg" style={{ color: 'var(--lx-accent)' }}>{club.join_code}</p>
            </div>
            <button onClick={() => copyText(club.join_code)} className="lx-btn-ghost text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy
            </button>
          </div>
        )}

        {club.pinned_announcement && (
          <div className="mb-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)' }}>
            <Pin size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{club.pinned_announcement}</p>
          </div>
        )}
      </div>
    </div>
  );
}