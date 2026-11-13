import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="fixed inset-0 flex" style={{ background: '#0a0a0a' }}>
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: '#0d0d0d', borderRight: '1px solid #1c1c1c' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 20% 110%, rgba(245,166,35,0.12), transparent)', pointerEvents: 'none' }} />
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio" style={{ height: 40, width: 40, borderRadius: 12, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 22, color: '#f5a623', fontFamily: "'Manrope', sans-serif" }}>Lexio</span>
        </Link>

        <div className="relative z-10">
          <h2 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-1px', color: '#f0ebe0', marginBottom: 16 }}>
            Your reading life,<br /><span style={{ color: '#f5a623' }}>supercharged.</span>
          </h2>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.7 }}>
            Track your books, discover new favorites, build streaks, and connect with other readers.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { emoji: '📚', text: 'Personal reading library & tracker' },
            { emoji: '🤖', text: 'AI recommendations & book companion' },
            { emoji: '🔥', text: 'Streaks, points & reading goals' },
            { emoji: '👥', text: 'Reading clubs & community forums' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <span style={{ fontSize: 16 }}>{f.emoji}</span>
              <span style={{ fontSize: 14, color: '#888' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <img src="https://media.base44.com/images/public/6a123803b5827eb9277efa4d/63f81eba7_7c1bd0943_logo.png"
            alt="Lexio" style={{ height: 32, width: 32, borderRadius: 8, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 20, color: '#f5a623', fontFamily: "'Manrope', sans-serif" }}>Lexio</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', color: '#f0ebe0', marginBottom: 6 }}>
              {title}
            </h1>
            {subtitle && <p style={{ color: '#666', fontSize: 15 }}>{subtitle}</p>}
          </div>

          <div className="rounded-2xl p-8" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm mt-6" style={{ color: '#555' }}>
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}