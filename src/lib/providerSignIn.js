import { appParams } from '@/lib/app-params';

// Sign-in must always be started on the platform origin. When the app runs on
// a custom domain, that domain answers auth paths with the app's own page and
// the handshake never starts; on devices holding an older cached copy it also
// breaks silently. Everything below is absolute on purpose, so no stored or
// inherited base URL can point it at the wrong host.
export const PLATFORM_AUTH_ORIGIN = 'https://app.base44.com';
export const PLATFORM_APP_ORIGIN = 'https://lexio-reading.base44.app';

function providerPath(provider) {
  return provider === 'google' ? '/api/apps/auth/login' : `/api/apps/auth/${provider}/login`;
}

function isPlatformHost(hostname) {
  return hostname === 'base44.app' || hostname.endsWith('.base44.app');
}

/**
 * Starts a social sign-in as a full page navigation.
 *
 * On a custom domain the provider handshake is completed on the platform's own
 * app origin, which then hands the session back to this domain through
 * /auth-handoff. That way the custom domain never has to carry an auth path.
 */
export function startProviderSignIn(provider, destination = '/') {
  const here = window.location;
  const dest = new URL(destination, here.origin).toString();
  const fromUrl = isPlatformHost(here.hostname)
    ? dest
    : `${PLATFORM_APP_ORIGIN}/auth-handoff?next=${encodeURIComponent(dest)}`;
  const query = `app_id=${encodeURIComponent(appParams.appId || '')}&from_url=${encodeURIComponent(fromUrl)}`;
  window.location.assign(`${PLATFORM_AUTH_ORIGIN}${providerPath(provider)}?${query}`);
}

export const AUTH_HANDOFF_PATH = '/auth-handoff';
export const SIGN_IN_ON_PLATFORM_URL = `${PLATFORM_APP_ORIGIN}/login`;