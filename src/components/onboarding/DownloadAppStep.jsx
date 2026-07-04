import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor, Smartphone, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { APP_CONFIG } from '@/lib/appConfig';
import { detectPlatform, STORAGE_KEYS } from '@/lib/platformDetect';
import AppStoreBadge from './AppStoreBadge';
import HomeScreenGuideModal from './HomeScreenGuideModal';

const APPLE_LOGO_PATH =
  'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z';

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