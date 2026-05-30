import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function LxSelect({ value, onChange, options, compact, className, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (!open || isMobile) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, isMobile]);

  // Lock body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open]);

  const btnClass = compact
    ? 'flex items-center gap-1 text-xs px-2 rounded border transition-all'
    : 'lx-input flex items-center justify-between gap-2 text-sm';

  const btnStyle = compact
    ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--lx-border)', minHeight: 44 }
    : { minHeight: 44 };

  return (
    <>
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

        {/* Desktop dropdown */}
        {open && !isMobile && (
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
                className="w-full text-left px-3 text-sm flex items-center justify-between"
                style={{
                  minHeight: 44,
                  background: opt.value === value ? 'var(--bg-elevated)' : 'transparent',
                  color: opt.value === value ? 'var(--lx-accent)' : 'var(--text-primary)',
                }}
              >
                {opt.label}
                {opt.value === value && <Check size={13} style={{ color: 'var(--lx-accent)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)', maxHeight: '70vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--lx-border)' }} />
            </div>
            <div className="overflow-y-auto pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full text-left px-5 flex items-center justify-between"
                  style={{
                    minHeight: 52,
                    background: opt.value === value ? 'var(--bg-elevated)' : 'transparent',
                    color: opt.value === value ? 'var(--lx-accent)' : 'var(--text-primary)',
                    fontSize: 16,
                  }}
                >
                  {opt.label}
                  {opt.value === value && <Check size={16} style={{ color: 'var(--lx-accent)' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}