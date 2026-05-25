import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function LxSelect({ value, onChange, options, compact, className, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const btnClass = compact
    ? 'flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all'
    : 'lx-input flex items-center justify-between gap-2 text-sm';

  const btnStyle = compact
    ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--lx-border)' }
    : {};

  return (
    <div ref={ref} className={`relative ${className || ''}`} style={style}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={btnClass}
        style={{ ...btnStyle, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        <span className="truncate">{current?.label || value}</span>
        <ChevronDown
          size={compact ? 10 : 14}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 rounded-lg border overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--lx-border)',
            boxShadow: 'var(--shadow)',
            minWidth: compact ? '140px' : '100%',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm"
              style={{
                background: opt.value === value ? 'var(--bg-elevated)' : 'transparent',
                color: opt.value === value ? 'var(--lx-accent)' : 'var(--text-primary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}