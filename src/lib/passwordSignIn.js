import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { PLATFORM_AUTH_ORIGIN, PLATFORM_APP_ORIGIN } from '@/lib/providerSignIn';

// Password sign-in posts straight to the platform, never to this app's own
// origin. On a custom domain the app-scoped auth path can be answered by the
// app's own 404 page (or by an old cached worker), which is what made sign-in
// appear broken there. The platform endpoint allows this origin, so the request
// works the same on the custom domain and on the platform domain.
export async function signInWithPassword(email, password) {
  const appId = appParams.appId || import.meta.env.VITE_BASE44_APP_ID;

  const response = await fetch(`${PLATFORM_AUTH_ORIGIN}/api/apps/${appId}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.detail || 'Invalid email or password');
  }

  // Accounts with a second factor are finished on the platform origin.
  if (data.mfa_required) {
    window.location.assign(`${PLATFORM_APP_ORIGIN}/login`);
    return;
  }

  if (!data.access_token) {
    throw new Error('Sign-in did not complete. Please try again.');
  }

  base44.auth.setToken(data.access_token);
}