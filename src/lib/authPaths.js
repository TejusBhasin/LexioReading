import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

// Every sign-in path below is an absolute platform path, on the platform's own
// origin. Nothing here builds an auth URL on the app's current host, so the same
// code works on lexioreading.app, on the platform domain and in the preview.
export const PLATFORM_ORIGIN = 'https://app.base44.com';
export const PLATFORM_APP_URL = 'https://lexio-reading.base44.app';

// Platform auth entry points, exactly as the platform serves them.
const PROVIDER_PATHS = {
  google: '/api/apps/auth/login',
  apple: '/api/apps/auth/apple/login',
  microsoft: '/api/apps/auth/microsoft/login',
};

function appId() {
  return appParams.appId || import.meta.env.VITE_BASE44_APP_ID;
}

/**
 * Social sign-in start URL. The handshake completes on the platform origin and
 * the platform returns to `destination` on whichever host the app is running,
 * carrying the session with it.
 */
export function providerSignInUrl(provider, destination = '/') {
  const fromUrl = new URL(destination, window.location.origin).toString();
  const path = PROVIDER_PATHS[provider] || PROVIDER_PATHS.google;
  return `${PLATFORM_ORIGIN}${path}?app_id=${encodeURIComponent(appId() || '')}&from_url=${encodeURIComponent(fromUrl)}`;
}

export function startProviderSignIn(provider, destination = '/') {
  window.location.assign(providerSignInUrl(provider, destination));
}

/**
 * Email + password sign-in against the platform's app-scoped auth endpoint.
 * Same accounts as always, posted straight to the platform origin.
 */
export async function signInWithPassword(email, password) {
  const response = await fetch(`${PLATFORM_ORIGIN}/api/apps/${appId()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.detail || 'Invalid email or password');
  }

  // Accounts with a second factor finish signing in on the platform.
  if (data.mfa_required) {
    window.location.assign(`${PLATFORM_APP_URL}/login`);
    return;
  }

  if (!data.access_token) {
    throw new Error('Sign-in did not complete. Please try again.');
  }

  base44.auth.setToken(data.access_token);
}