import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appParams } from '@/lib/app-params';

function readToken() {
  if (appParams.token) return appParams.token;
  try {
    return localStorage.getItem('base44_access_token') || localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}

function safeDestination(next) {
  try {
    const url = new URL(next || '/', window.location.origin);
    const host = url.hostname;
    const allowed =
      host === window.location.hostname ||
      host === 'lexioreading.app' ||
      host === 'base44.app' ||
      host.endsWith('.base44.app');
    return allowed ? url : null;
  } catch (e) {
    return null;
  }
}

/**
 * Landing point after a provider sign-in finished on the platform origin.
 * Carries the session token over to this domain, so signing in never depends
 * on this domain handling an auth path.
 */
export default function AuthHandoff() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = safeDestination(params.get('next'));
    const token = readToken();

    if (!dest || !token) {
      setFailed(true);
      return;
    }

    dest.searchParams.set('access_token', token);
    window.location.replace(dest.toString());
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="text-center max-w-sm">
        {failed ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#f0ebe0', marginBottom: 8 }}>
              Sign-in didn't complete
            </h1>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
              Nothing has been lost — your books, reviews and lists are safe. Please try signing in again.
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 rounded-lg font-bold"
              style={{ background: '#f5d623', color: '#0a0a0a', fontSize: 14 }}
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <p style={{ color: '#f5d623', fontSize: 15, fontWeight: 700 }}>Signing you in…</p>
        )}
      </div>
    </div>
  );
}