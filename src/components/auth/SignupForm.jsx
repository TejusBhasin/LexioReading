import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SignupForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setError('');
    try {
      await base44.auth.register(name, email, password);
      const user = await base44.auth.me();
      onSuccess?.(user);
    } catch (err) {
      setError(err?.message || 'Could not create account. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    base44.auth.redirectToLogin(window.location.href);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Create your account
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Your personal AI reading companion awaits</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="lx-input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="lx-input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="lx-input pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--lx-accent-secondary)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="lx-btn-primary w-full justify-center py-3"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
          {!loading && <ArrowRight size={15} />}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--lx-accent)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={handleGoogle}
          className="lx-btn-ghost w-full justify-center"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}