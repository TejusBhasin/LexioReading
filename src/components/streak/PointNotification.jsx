import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';

let notificationQueue = [];
let listeners = [];

export function showPointNotification(points, reason) {
  const id = Date.now() + Math.random();
  notificationQueue.push({ id, points, reason });
  listeners.forEach(fn => fn([...notificationQueue]));
}

export function usePointNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handler = (q) => setNotifications([...q]);
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, []);

  function dismiss(id) {
    notificationQueue = notificationQueue.filter(n => n.id !== id);
    listeners.forEach(fn => fn([...notificationQueue]));
  }

  return { notifications, dismiss };
}

export default function PointNotificationContainer() {
  const { notifications, dismiss } = usePointNotifications();

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {notifications.slice(-3).map(n => (
        <div
          key={n.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg pointer-events-auto fade-in"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--lx-accent)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: '200px',
          }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            <Zap size={14} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>+{n.points} pts</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{n.reason}</p>
          </div>
          <button onClick={() => dismiss(n.id)} className="flex-shrink-0">
            <X size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      ))}
    </div>
  );
}