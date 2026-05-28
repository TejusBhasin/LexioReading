import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Megaphone, MessageCircle, BookOpen, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  forum_reply: MessageCircle,
  club_new_book: BookOpen,
  broadcast: Megaphone,
  general: Info,
};

function groupNotifications(notifs) {
  const groups = {};
  for (const n of notifs) {
    const key = n.group_key || n.type + '_' + n.id;
    if (!groups[key]) {
      groups[key] = { key, items: [], type: n.type, title: n.title, latestBody: n.body, latestDate: n.created_date, link: n.link, allRead: true };
    }
    groups[key].items.push(n);
    if (!n.is_read) groups[key].allRead = false;
    if (new Date(n.created_date) > new Date(groups[key].latestDate)) {
      groups[key].latestDate = n.created_date;
      groups[key].latestBody = n.body;
      groups[key].title = n.title;
    }
  }
  return Object.values(groups).sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lx_dismissed_broadcasts') || '[]'); } catch { return []; }
  });
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) return;
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function loadAll() {
    const [notifs, broads] = await Promise.all([
      base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50),
      base44.entities.UserBroadcast.filter({ is_active: true }, '-created_date', 10),
    ]);
    setNotifications(notifs);
    setBroadcasts(broads);
  }

  async function markGroupRead(group) {
    const unread = group.items.filter(n => !n.is_read);
    if (unread.length === 0) return;
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => group.items.find(i => i.id === n.id) ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  function dismissBroadcast(id) {
    const next = [...dismissedBroadcasts, id];
    setDismissedBroadcasts(next);
    localStorage.setItem('lx_dismissed_broadcasts', JSON.stringify(next));
  }

  const visibleBroadcasts = broadcasts.filter(b => !dismissedBroadcasts.includes(b.id));
  const groups = groupNotifications(notifications);
  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const totalUnread = unreadNotifCount + visibleBroadcasts.length;

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded transition-colors"
        style={{ color: open ? 'var(--lx-accent)' : 'var(--text-secondary)' }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {totalUnread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-0.5"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-[200] overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--lx-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            {unreadNotifCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs" style={{ color: 'var(--lx-accent)' }}>
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="max-h-96 overflow-y-auto">
            {visibleBroadcasts.length === 0 && groups.length === 0 && (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
              </div>
            )}

            {/* Broadcasts */}
            {visibleBroadcasts.map(b => (
              <div key={b.id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--lx-border)', background: 'rgba(245,166,35,0.06)' }}>
                <div className="flex items-start gap-2">
                  <Megaphone size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--lx-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>Announcement</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                    {b.body && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{b.body}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(b.created_date)}</p>
                  </div>
                  <button onClick={() => dismissBroadcast(b.id)} className="flex-shrink-0 p-0.5" style={{ color: 'var(--text-muted)' }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Grouped notifications */}
            {groups.map(group => {
              const Icon = TYPE_ICONS[group.type] || Info;
              return (
                <div
                  key={group.key}
                  className="px-4 py-3 border-b cursor-pointer transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--lx-border)', background: group.allRead ? 'transparent' : 'rgba(245,166,35,0.04)' }}
                  onClick={() => {
                    markGroupRead(group);
                    if (group.link) { navigate(group.link); setOpen(false); }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!group.allRead && (
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--lx-accent)' }} />
                    )}
                    <Icon size={14} className={`mt-0.5 flex-shrink-0 ${group.allRead ? 'opacity-50' : ''}`} style={{ color: 'var(--lx-accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate" style={{ color: group.allRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {group.title}
                          {group.items.length > 1 && <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({group.items.length})</span>}
                        </p>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(group.latestDate)}</span>
                      </div>
                      {group.latestBody && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{group.latestBody}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}