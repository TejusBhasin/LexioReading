import { base44 } from '@/api/base44Client';

// The platform owns every sign-in step. Its SDK builds the auth URL for this app
// and, when the app runs inside a preview frame, finishes the handshake in a
// popup instead of navigating the frame.
export function startProviderSignIn(provider, returnTo = '/') {
  return base44.auth.loginWithProvider(provider, returnTo);
}

export function signInWithPassword(email, password) {
  return base44.auth.loginViaEmailPassword(email, password);
}

// Leftovers from a sign-in that never finished (closed popup, half-open MFA,
// older handoff attempts) can leave the next attempt in a broken state.
const IN_FLIGHT = /handoff|pending_signin|pending_auth|oauth_pending|app-mfa-pkce/i;

export function clearPendingSignIn() {
  try {
    for (const store of [sessionStorage, localStorage]) {
      Object.keys(store)
        .filter((key) => IN_FLIGHT.test(key))
        .forEach((key) => store.removeItem(key));
    }
  } catch (e) {
    // storage unavailable — nothing to clear
  }
}

// Wipes tokens and the platform's sign-in cookies, then comes back here.
export function restartSignIn() {
  clearPendingSignIn();
  base44.auth.logout(window.location.href);
}