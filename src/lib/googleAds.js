// Google Ads signup conversion tracking
// Replace these with your actual Google Ads IDs (Tools → Conversions in Google Ads)
export const GOOGLE_ADS_ID = 'AW-XXXXXXXXX';        // e.g. AW-123456789
export const SIGNUP_CONVERSION_LABEL = 'XXXXXXXXXX'; // e.g. abcDEF123

// Loads gtag.js (idempotent — safe to call multiple times)
export function ensureGtag() {
  if (window.gtag) return Promise.resolve();
  return new Promise((resolve) => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ADS_ID);

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

// Fire the signup conversion. Call this exactly once when a user completes signup.
export async function trackSignup() {
  try {
    await ensureGtag();
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${SIGNUP_CONVERSION_LABEL}`,
    });
  } catch (e) {
    // Never let tracking break signup
  }
}