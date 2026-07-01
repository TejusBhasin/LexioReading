import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export default function PinPad({ length = 4, onComplete }) {
  const [pin, setPin] = useState('');

  function addDigit(d) {
    if (pin.length >= length) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === length) {
      setTimeout(() => {
        onComplete(newPin);
        setPin('');
      }, 150);
    }
  }

  function deleteDigit() {
    setPin(pin.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Dots */}
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
            style={{
              background: i < pin.length ? 'var(--lx-accent)' : 'transparent',
              border: `2px solid ${i < pin.length ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }} />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button key={d} onClick={() => addDigit(String(d))}
            className="w-16 h-16 rounded-xl font-display text-xl font-bold flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--lx-border)' }}>
            {d}
          </button>
        ))}
        <div className="w-16 h-16" />
        <button onClick={() => addDigit('0')}
          className="w-16 h-16 rounded-xl font-display text-xl font-bold flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--lx-border)' }}>
          0
        </button>
        <button onClick={deleteDigit} disabled={pin.length === 0}
          className="w-16 h-16 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)', opacity: pin.length === 0 ? 0.4 : 1 }}>
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}