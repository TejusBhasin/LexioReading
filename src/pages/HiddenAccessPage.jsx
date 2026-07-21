import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HiddenAccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (code.trim() === 'hixboh-gehkub-3hatmE') {
      navigate('/book-creator');
    } else {
      setError(true);
      setCode('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          className="lx-input text-center"
          placeholder="Enter code"
          autoFocus
          style={error ? { borderColor: '#f87171' } : {}}
        />
        {error && <p className="text-xs text-center mt-2" style={{ color: '#f87171' }}>Invalid code</p>}
        <button type="submit" className="lx-btn-primary w-full justify-center mt-3">
          Submit
        </button>
      </form>
    </div>
  );
}