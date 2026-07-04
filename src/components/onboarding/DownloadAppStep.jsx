import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor, Smartphone, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { APP_CONFIG } from '@/lib/appConfig';
import { detectPlatform, STORAGE_KEYS } from '@/lib/platformDetect';
import AppStoreBadge from './AppStoreBadge';
import HomeScreenGuideModal from './HomeScreenGuideModal';

const APPLE_LOGO_PATH =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z';

export default function DownloadAppStep({ onContinue, onBack }) {
  const [showGuide, setShowGuide] = useState(false);
  const platform = detectPlatform();
  const isDesktop = platform.isDesktop;

  useEffect(() => {
    try {
      base44.analytics.track({ eventName: 'onboarding_appstore_viewed' });
    } catch (e) {}
  }, []);

  function handleAppStoreClick() {
    try {
      base44.analytics.track({ eventName: 'onboarding_appstore_clicked' });
    } catch (e) {}
    try {
      localStorage.setItem(STORAGE_KEYS.appInstalled, 'true');
    } catch (e) {}
    window.open(APP_CONFIG.appStoreUrl, '_blank', 'noopener,noreferrer');
  }

  function handleContinueWeb() {
    try {
      base44.analytics.track({ eventName: 'onboarding_continue_web' });
    } catch (e) {}
    try {
      localStorage.setItem(STORAGE_KEYS.downloadDismissed, 'true');
    } catch (e) {}
    onContinue();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-center"
    >
      {/* Phone Illustration */}
      <div className="relative mx-auto mb-6" style={{ width: 100, height: 190 }}>
        <div
          className="absolute inset-0 rounded-[1.5rem]"
          style={{ background: 'var(--bg-elevated)', border: '3px solid var(--lx-border)' }}
        >
          {/* Notch */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
            style={{ background: 'var(--lx-border)' }}
          />
          {/* App icon on screen */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--lx-accent)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--bg-primary)" aria-hidden="true">
                <path d={APPLE_LOGO_PATH} />
              </svg>
            </div>
            <div className="w-8 h-1 rounded-full" style={{ background: 'var(--lx-border)' }} />
            <div className="w-6 h-1 rounded-full" style={{ background: 'var(--lx-border)' }} />
          </div>
        </div>
        {/* Platform badge */}
        <div
          className="absolute -right-2 -bottom-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'var(--lx-accent)' }}
        >
          {isDesktop ? (
            <Monitor size={14} style={{ color: 'var(--bg-primary)' }} />
          ) : (
            <Smartphone size={14} style={{ color: 'var(--bg-primary)' }} />
          )}
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Take us with you.
      </h2>
      <p className="text-sm mb-6 px-1" style={{ color: 'var(--text-secondary)' }}>
        Get the best experience by downloading the iPhone app. Enjoy faster performance, native
        notifications, quick launching, and a more seamless experience.
      </p>

      {/* App Store Button */}
      <div className="flex justify-center mb-3">
        <AppStoreBadge onClick={handleAppStoreClick} />
      </div>

      {/* Continue on Web */}
      <button onClick={handleContinueWeb} className="lx-btn-ghost w-full justify-center text-sm mb-3">
        Continue on Web <ArrowRight size={14} />
      </button>

      {/* Home Screen Guide — hidden on desktop */}
      {!isDesktop && (
        <button
          onClick={() => setShowGuide(true)}
          className="text-xs underline transition-opacity hover:opacity-80 block mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          Using the web? Learn how to add this app to your Home Screen.
        </button>
      )}

      {/* Back */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs mt-4 inline-flex items-center gap-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={12} /> Back
        </button>
      )}

      {showGuide && <HomeScreenGuideModal onClose={() => setShowGuide(false)} />}
    </motion.div>
  );
}