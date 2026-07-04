import React from 'react';

/**
 * Apple-style "Download on the App Store" badge.
 *
 * Generic, reusable component.  The actual App Store URL is handled
 * by the parent via onClick — this badge only renders the visual.
 */
const APPLE_LOGO_PATH =
  'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z';

export default function AppStoreBadge({ onClick, className = '', style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Download on the App Store"
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90 active:opacity-80 ${className}`}
      style={{
        background: '#000',
        color: '#fff',
        border: '1px solid #333',
        ...style,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={APPLE_LOGO_PATH} />
      </svg>
      <span className="flex flex-col items-start leading-tight text-left">
        <span style={{ fontSize: '0.625rem', lineHeight: 1 }}>Download on the</span>
        <span style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.2 }}>
          App Store
        </span>
      </span>
    </button>
  );
}