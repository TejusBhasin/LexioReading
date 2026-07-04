import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share,
  PlusSquare,
  Check,
  Home,
  Zap,
  Maximize2,
  MousePointer,
  Smartphone,
  Layers,
  Compass,
  Copy,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { detectPlatform } from '@/lib/platformDetect';

const GUIDE_STEPS = [
  { icon: Share, title: 'Step 1', desc: 'Tap the Share button in Safari.' },
  { icon: PlusSquare, title: 'Step 2', desc: 'Scroll until you find “Add to Home Screen”.' },
  { icon: Check, title: 'Step 3', desc: 'Tap “Add”.' },
  { icon: Home, title: 'Step 4', desc: 'Launch the app directly from your Home Screen.' },
];

const BENEFITS = [
  { icon: Zap, label: 'Faster launching' },
  { icon: Maximize2, label: 'Full-screen experience' },
  { icon: MousePointer, label: 'Easy access' },
  { icon: Smartphone, label: 'Native-like feel' },
  { icon: Layers, label: 'Better multitasking' },
];

export default function HomeScreenGuideModal({ onClose }) {
  const platform = detectPlatform();
  const isSafari = platform.isSafari;

  useEffect(() => {
    try {
      base44.analytics.track({ eventName: 'onboarding_homescreen_opened' });
    } catch (e) {}
  }, []);

  function handleClose() {
    try {
      base44.analytics.track({ eventName: 'onboarding_homescreen_completed' });
    } catch (e) {}
    onClose();
  }

  function copyUrl() {
    try {
      navigator.clipboard.writeText(window.location.href);
    } catch (e) {}
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Add to Home Screen
            </h2>
            <button onClick={handleClose} aria-label="Close" className="p-1">
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Browser notice (non-Safari) */}
          {!isSafari && (
            <div
              className="rounded-lg p-3 mb-5"
              style={{ background: 'rgba(245,214,35,0.1)', border: '1px solid rgba(245,214,35,0.3)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                Home Screen installation works best in Safari. For the best experience, open this page in Safari.
              </p>
              <button
                onClick={copyUrl}
                className="text-xs font-medium px-3 py-1.5 rounded inline-flex items-center gap-1.5"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}
              >
                <Copy size={12} /> Copy URL for Safari
              </button>
            </div>
          )}

          {/* Safari badge */}
          {isSafari && (
            <div
              className="rounded-lg p-3 mb-5 flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <Compass size={14} style={{ color: '#10b981' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                You're in Safari — follow the steps below.
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {GUIDE_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--lx-accent)' }}
                >
                  <step.icon size={16} style={{ color: 'var(--bg-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {step.title}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Benefits */}
          <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--bg-elevated)' }}>
            <p className="font-bold text-xs mb-3" style={{ color: 'var(--text-primary)' }}>
              Why add to Home Screen?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <b.icon size={14} style={{ color: 'var(--lx-accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleClose} className="lx-btn-primary w-full justify-center text-sm">
            Got it
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}