/**
 * Platform detection utilities.
 *
 * Determines whether the app is running inside the native iOS app,
 * an installed PWA (Add to Home Screen), a regular mobile browser,
 * or on desktop.  Generic — works across any Base44 project.
 */

/**
 * Detect the current runtime platform.
 * @returns {Object} platform info
 */
export function detectPlatform() {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isStandalone: false,
      isNativeApp: false,
      isSafari: false,
      isDesktop: true,
      isWebBrowser: false,
      isPWA: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;

  // PWA / Add to Home Screen — display-mode standalone or iOS Safari standalone
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;

  // Native app (Capacitor, Cordova, or a custom marker the native shell sets)
  const isNativeApp = !!(
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.cordova ||
    document.documentElement.dataset.nativeApp === 'true' ||
    _safeLocal('lexio_native_app') === 'true'
  );

  // Safari on iOS (excluding Chrome, Firefox, Edge on iOS which are also WebKit but different)
  const isSafari =
    isIOS &&
    /Safari\//.test(ua) &&
    !/CriOS/.test(ua) &&
    !/FxiOS/.test(ua) &&
    !/EdgiOS/.test(ua);

  const isDesktop = !isMobile;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isStandalone,
    isNativeApp,
    isSafari,
    isDesktop,
    isWebBrowser: !isNativeApp && !isStandalone,
    isPWA: isStandalone && !isNativeApp,
  };
}

/** localStorage keys used for persistent skip logic. */
export const STORAGE_KEYS = {
  appInstalled: 'lexio_app_installed',
  downloadDismissed: 'lexio_download_step_dismissed',
};

/**
 * Evaluate whether the download-app onboarding step should be shown.
 * Returns { shouldShow, reason } where reason is one of:
 *   'native_app' | 'existing_install' | 'recent_dismissal' | null
 */
export function getDownloadStepStatus() {
  const platform = detectPlatform();

  if (platform.isNativeApp) return { shouldShow: false, reason: 'native_app' };
  if (platform.isStandalone || _safeLocal(STORAGE_KEYS.appInstalled) === 'true')
    return { shouldShow: false, reason: 'existing_install' };
  if (_safeLocal(STORAGE_KEYS.downloadDismissed) === 'true')
    return { shouldShow: false, reason: 'recent_dismissal' };

  return { shouldShow: true, reason: null };
}

/** Maps a skip reason to its analytics event name. */
export const SKIP_EVENT_MAP = {
  native_app: 'onboarding_skipped_due_to_native_app',
  existing_install: 'onboarding_skipped_due_to_existing_install',
  recent_dismissal: 'onboarding_skipped_due_to_recent_dismissal',
};

// ── helpers ──────────────────────────────────────────────

function _safeLocal(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}