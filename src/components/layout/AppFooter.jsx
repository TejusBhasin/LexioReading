import React from 'react';
import { Link } from 'react-router-dom';
import { detectPlatform } from '@/lib/platformDetect';

const APP_STORE_URL = 'https://apps.apple.com/nz/app/lexio-reading/id6781776997';

const APPLE_LOGO_PATH =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z';

export default function AppFooter({ dark = false }) {
  const { isNativeApp } = detectPlatform();
  const bg = dark ? '#080808' : 'var(--bg-secondary)';
  const borderColor = dark ? '#1c1c1c' : 'var(--lx-border)';
  const textColor = dark ? '#888' : 'var(--text-muted)';
  const linkColor = dark ? '#f5a623' : 'var(--lx-accent)';
  const labelColor = dark ? '#f0ebe0' : 'var(--text-secondary)';

  return (
    <footer style={{ borderTop: `1px solid ${borderColor}`, background: bg, padding: '32px 16px', textAlign: 'center' }}>
      {/* App Store Button — hidden in native iOS app */}
      {!isNativeApp && (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12, background: '#000', border: '1px solid #333', textDecoration: 'none', marginBottom: 20 }}
      >
        <svg width="20" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d={APPLE_LOGO_PATH} />
        </svg>
        <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
          <div style={{ fontSize: 9, color: '#aaa', fontWeight: 500 }}>Download on the</div>
          <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>App Store</div>
        </div>
      </a>
      )}

      {/* Links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
        {[
          { label: 'Terms', to: '/terms-privacy' },
          { label: 'Privacy Policy', to: '/terms-privacy' },
          { label: 'FAQ', to: '/support' },
          { label: 'Support', to: '/support' },
        ].map(({ label, to }) => (
          <Link key={label} to={to} style={{ color: linkColor, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            {label}
          </Link>
        ))}
      </div>

      <p style={{ fontSize: 12, color: textColor }}>
        Questions? Email{' '}
        <a href="mailto:Support@LexioReading.App" style={{ color: linkColor, fontWeight: 600, textDecoration: 'none' }}>
          Support@LexioReading.App
        </a>
      </p>
    </footer>
  );
}